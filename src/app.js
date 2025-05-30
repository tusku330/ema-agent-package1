import { GoogleGenAI, Type } from '@google/genai';
import { getServiceCodeFromSuggestion, getServiceCodeByName, initializeAgentServiceIdentify } from './tool_service_identify.js';
import { createServiceEnquiryTool } from './tool_create_service.js';
import { sendEnquiryDataTool } from './tool_send_email.js';

import { getState, session_store } from './session_store.js';

import 'dotenv/config';

// #region Configure Tools

const serviceCreateByName = {
    name: "uilchilgee_esvel_lavlagaa_avah_uusgekh",
    description: "E-mongolia системийн үйлчилгээ, лавлагаа, гэрчилгээ, тодорхойлолт авч өгнө. Энэ функцийг хэрэглэгч үйлчилгээний нэр өгсөн тохиолдолд ашиглана. Жишээ нь: 'Иргэний үнэмлэхийн лавлагаа', 'Зээлийн мэдээлэлийн лавлагаа'. Үйлчилгээ, лавлагаа амжилттай авсан тохиолдолд 'request_number' ашиглан хэрэглэгчээс имэйл хаяг руу илгээх эсэх асууна.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            uilchilgeenii_ner: {
                type: Type.STRING,
                description: "Үйлчилгээ, лавлагаа авахад ашиглах үйлчилгээний нэр.",
            },
        },
        required: ["uilchilgeenii_ner"],
    },
};

const serviceInformation = {
    name: "uilchilgee_esvel_lavlagaa_holbootoi_medeelel_avah",
    description: "E-mongolia системийн үйлчилгээ, лавлагаа, гэрчилгээ тухай хамааралтай мэдээлэл өгөх. Жишээ нь: 'Иргэний үнэмлэхийн лавлагаа хэрхэн авах вэ', 'Гадаад паспорт хэрхэн захиалах уу?'",
    parameters: {
        type: Type.OBJECT,
        properties: {
            uilchilgeenii_ner: {
                type: Type.STRING,
                description: "Үйлчилгээ, лавлагааны холбоотой мэдээлэл авахад ашиглах үйлчилгээний нэр.",
            },
        },
        required: ["uilchilgeenii_ner"],
    },
};


const sendDataToEmail = {
    name: "avsan_lavlagaag_email_ruu_ilgeeh",
    description: "Хэрэглэгчийн имэйл хаяг руу лавлагаа илгээнэ. Энэ функцийг хэрэглэгч имэйл хаягаа өгсөн болон лавлагаа амжилттай үүсгэсэн тохиолдолд ашиглана.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            request_number: {
                type: Type.STRING,
                description: "Авсан үйлчилгээний болон лавлагааны хүсэлтийн дугаар.",
            },
            hereglegchiin_email: {
                type: Type.STRING,
                description: "Хэрэглэгчийн өгсөн имэйл хаяг.",
            },
        },
        required: ["request_number", "hereglegchiin_email"],
    },
}

// #endregion


// #region Configure model
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const config = {
    tools: [{
        functionDeclarations: [serviceCreateByName, sendDataToEmail, serviceInformation]
    }],
    // Force the model to call 'any' function, instead of chatting.
    // toolConfig: {
    //     functionCallingConfig: {
    //         mode: 'auto'
    //     }
    // },
    maxOutputTokens: 500,
    temperature: 0.1,
    systemInstruction: "You are E-mongolia system assistant. Your help user for creating service-enquiry and giving information about e-mongolia services. Answer only in mongolian language",
};

async function botGenerateContent(contents) {
    return await genAI.models.generateContent({
        // model: 'gemini-2.5-flash-preview-05-20"',  // gemini-2.0-flash, gemini-2.5-pro
        model: 'gemini-2.0-flash',
        contents: contents,
        config: config
    });
}

// #endregion


// #region chat
let state = null;

async function functionToolResponse(functionCall, resultFuncCall) {

    // Create a function response part
    const function_response_part = {
        name: functionCall.name,
        response: { resultFuncCall }
    }

    // Append function call and result of the function execution to contents
    state.conversation.push({ role: 'model', parts: [{ functionCall: functionCall }] });
    state.conversation.push({ role: 'user', parts: [{ functionResponse: function_response_part }] });

    console.log("function_response_part ", function_response_part)
    // Get the final response from the model
    const final_response = await botGenerateContent(state.conversation);
    console.log("\nBot Response:", final_response.text);

    state.tool = "general"
    state.response = true;
    state.responseText = final_response.text;
}

export async function emaBot(message, user_id) {
    state = getState(user_id);

    while (state.response === false) {
        await chatBot(message, user_id)
    }
}

export async function chatBot(message, user_id) {
    state = getState(user_id);
    // console.log('session_store ', session_store)

    if (state.tool === "general") {

        if (message != null)
            state.conversation.push({
                role: 'user',
                parts: [{ text: message }]
            });


        //Send request with function declarations
        const response = await botGenerateContent(state.conversation);
        // Check for function calls in the response
        if (response.functionCalls && response.functionCalls.length > 0) {
            state.functionCall = response.functionCalls[0]; // Assuming one function call
            console.log(`Function to call: ${state.functionCall.name}`);
            console.log(`Arguments: ${JSON.stringify(state.functionCall.args)}`);

            if (state.functionCall.name === "uilchilgee_esvel_lavlagaa_avah_uusgekh") {
                state.tool = "service-identify";
                // await botChat(state.functionCall.args.uilchilgeenii_ner)
            }
            else if (state.functionCall.name === "avsan_lavlagaag_email_ruu_ilgeeh") {
                //state.tool = "send-email";
                state.request_number = state.functionCall.args.request_number
                state.user_email = state.functionCall.args.hereglegchiin_email
                // botChat(state.functionCall.args.request_number)

                state.resultFuncCall = await sendEnquiryDataTool(state.request_number, state.user_email)
                await functionToolResponse(state.functionCall, state.resultFuncCall)
            }
        } else {
            state.response = true;
            state.responseText = response.text;
        }
    }
    else if (state.tool === "service-identify") {
        if (state.service_code != null) {
            state.tool = "service-create";
            // await botChat()
        }
        else if (state.service_suggest === true) {
            await getServiceCodeFromSuggestion(message, user_id)
            if (state.service_code != null) {
                state.tool = "service-create";
                // await botChat(state.service_code)
            }
        }
        else if (state.service_suggest === false) {
            await getServiceCodeByName(message, user_id)
            if (state.service_code != null) {
                state.tool = "service-create";

                state.response = identify_state.response;
                state.responseText = identify_state.responseText;
            }
        }
    }
    else if (state.tool === "service-create") {
        if (state.service_code != null) {
            state.resultFuncCall = await createServiceEnquiryTool(state.service_code)
            state.request_number = state.resultFuncCall.request_number
            await functionToolResponse(state.functionCall, state.resultFuncCall)

            // startChat();
        }
    }
}

await initializeAgentServiceIdentify();

// #endregion
