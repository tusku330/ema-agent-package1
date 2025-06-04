import { GoogleGenAI, Type } from '@google/genai';
import { getServiceCodeFromSuggestion, getServiceCodeByName, initializeAgentServiceIdentify } from './component/tool_service_identify.js';
import { createServiceEnquiryTool } from './component/tool_create_service.js';
import { sendEnquiryDataTool } from './component/tool_send_email.js';
import { setPromptLabelData, getValueFromPrompt } from './component/tool_prompt_label.js';
import serviceList from './datasets/emon_service_list_v1.json' with { type: 'json' };

import { getState } from './component/session_store.js';

import 'dotenv/config';

// #region Configure Tools

const serviceCreateByName = {
    name: "uilchilgee_esvel_lavlagaa_avah_uusgekh",
    description: "E-Mongolia системээс хэрэглэгчийн хүссэн 'үйлчилгээ', 'лавлагаа', 'гэрчилгээ' эсвэл 'тодорхойлолт'-ыг үүсгэж өгнө. Энэ функцийг хэрэглэгч ямар үйлчилгээ авахыг тодорхой нэрлэсэн тохиолдолд ашиглана. Жишээ нь: 'Иргэний үнэмлэхийн лавлагаа', 'Зээлийн мэдээллийн лавлагаа'. Үйлчилгээ амжилттай үүссэний дараа, 'request_number' ашиглан хэрэглэгчээс имэйл хаяг руу илгээх эсэхийг асуух шаардлагатай.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            uilchilgeenii_ner: {
                type: Type.STRING,
                description: "Хэрэглэгчийн хүсэж буй E-Mongolia системийн үйлчилгээ, лавлагаа, гэрчилгээ эсвэл тодорхойлолтын *бүрэн нэр* (жишээ нь: 'Иргэний үнэмлэхийн лавлагаа'). Энэ нь функцийг дуудахад зайлшгүй шаардлагатай.",
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
    description: "Үүсгэсэн 'үйлчилгээ', 'лавлагаа', 'гэрчилгээ' эсвэл 'тодорхойлолт'-ыг хэрэглэгчийн өгсөн имэйл хаяг руу илгээнэ. Энэ функцийг зөвхөн E-Mongolia систем дээр хүсэлт амжилттай үүсгэгдэж, 'request_number' дугаар олгогдсон бөгөөд хэрэглэгч имэйл хаягаа тодорхой заасан тохиолдолд ашиглана.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            request_number: {
                type: Type.STRING,
                description: "E-Mongolia системээс амжилттай үүсгэсэн үйлчилгээ, лавлагаа, гэрчилгээ, эсвэл тодорхойлолтын *хүсэлтийн дугаар*. Энэ нь өмнөх 'uilchilgee_esvel_lavlagaa_avah_uusgekh' функцийг амжилттай дуудсаны үр дүнд олгогдоно.",
            },
            hereglegchiin_email: {
                type: Type.STRING,
                description: "Хэрэглэгчийн хүсэлтээр үйлчилгээ/лавлагааг илгээх *имэйл хаяг*. Зөв, бүрэн имэйл хаяг байх шаардлагатай.",
            },
        },
        required: ["request_number", "hereglegchiin_email"],
    },
}

const generalInfo = {
    //    name: "yerunhii_medeelel_uguh_asuukh",
    name: "systemiin_medeelel_ugnuu",
    //    description: "E-Mongolia системийн ерөнхий мэдээлэл ашиглах заавар, бусад мэдээллийг хэрэглэгчид өгнө.",
    description: "системийн ерөнхий мэдээлэл ашиглах заавар, бусад мэдээллийг хэрэглэгчид өгнө.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            medeeleliin_turul: {
                type: Type.STRING,
                description: "Хэрэглэгчийн асууж буй мэдээллийн төрөл эсвэл түлхүүр үг (жишээ нь: 'бүртгэл', 'нэвтрэх', 'үйлчилгээний жагсаалт').",
            },
        },
        required: ["medeeleliin_turul"],
    },
};

// #endregion


// #region Configure model
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const config = {
    tools: [{
        functionDeclarations: [serviceCreateByName, sendDataToEmail, serviceInformation, generalInfo]
    }],
    // Force the model to call 'any' function, instead of chatting.
    // toolConfig: {
    //     functionCallingConfig: {
    //         mode: 'auto'
    //     }
    // },
    maxOutputTokens: 500,
    temperature: 0.1,
    //  v1 systemInstruction: "You are E-mongolia system assistant. Your help user for creating enquiry and giving information about e-mongolia services. Answer only in mongolian language",
    // systemInstruction: "Та бол E-Mongolia системийн туслах юм. Хэрэглэгчдэд E-Mongolia үйлчилгээ, лавлагаа үүсгэх, мэдээлэл өгөхөд тусална. Зөвхөн Монгол хэлээр хариулна. Хэрэглэгчийн хүсэлтийг ойлгож, үйлчилгээг нь хурдан шуурхай авахад нь туслахыг хичээгээрэй."
    systemInstruction: "Та бол E-Mongolia системийн туслах юм. Хэрэглэгчдэд E-Mongolia үйлчилгээ, лавлагаа үүсгэх, үйлчилгээний болон системийн талаар мэдээлэл өгөхөд тусална. Зөвхөн Монгол хэлээр хариулна. Хэрэглэгчийн хүсэлтийг ойлгож, үйлчилгээг нь хурдан шуурхай авахад нь туслахыг хичээгээрэй."
    // v3 systemInstruction: "Та бол E-Mongolia системийн туслах. E-Mongolia үйлчилгээ, лавлагаа үүсгэх, мэдээлэл өгөхөд хэрэглэгчдэд тусална. Зөвхөн Монгол хэлээр харилцана."
};

const config2 = {
    maxOutputTokens: 500,
    temperature: 0.1,
    //  v1 systemInstruction: "You are E-mongolia system assistant. Your help user for creating enquiry and giving information about e-mongolia services. Answer only in mongolian language",
    systemInstruction: "Та бол E-Mongolia системийн туслах юм. Хэрэглэгчдэд E-Mongolia үйлчилгээ, лавлагаа үүсгэх, мэдээлэл өгөхөд тусална. Зөвхөн Монгол хэлээр хариулна. Хэрэглэгчийн хүсэлтийг ойлгож, үйлчилгээг нь хурдан шуурхай авахад нь туслахыг хичээгээрэй."
    // v3 systemInstruction: "Та бол E-Mongolia системийн туслах. E-Mongolia үйлчилгээ, лавлагаа үүсгэх, мэдээлэл өгөхөд хэрэглэгчдэд тусална. Зөвхөн Монгол хэлээр харилцана."
};


const config3 = {
    maxOutputTokens: 500,
    temperature: 0.1,
    //  v1 systemInstruction: "You are E-mongolia system assistant. Your help user for creating enquiry and giving information about e-mongolia services. Answer only in mongolian language",
    systemInstruction: "Та бол E-Mongolia системийн туслах юм. Хэрэглэгчдэд E-Mongolia үйлчилгээ, лавлагаа үүсгэх, мэдээлэл өгөхөд тусална. Зөвхөн Монгол хэлээр хариулна. Хэрэглэгчийн хүсэлтийг ойлгож, үйлчилгээг нь хурдан шуурхай авахад нь туслахыг хичээгээрэй."
    // v3 systemInstruction: "Та бол E-Mongolia системийн туслах. E-Mongolia үйлчилгээ, лавлагаа үүсгэх, мэдээлэл өгөхөд хэрэглэгчдэд тусална. Зөвхөн Монгол хэлээр харилцана."
};

async function botGenerateContent(contents) {
    return await genAI.models.generateContent({
        // model: 'gemini-2.5-flash-preview-05-20"',  // gemini-2.0-flash, gemini-2.5-pro
        model: 'gemini-1.5-pro-latest',
        contents: contents,
        config: config
    });
}

async function botGenerateContent2(contents) {
    return await genAI.models.generateContent({
        // model: 'gemini-2.5-flash-preview-05-20"',  // gemini-2.0-flash, gemini-2.5-pro
        model: 'gemini-1.5-pro-latest',
        contents: contents,
        config: config2
    });
}

async function botGenerateContent3(contents) {
    return await genAI.models.generateContent({
        // model: 'gemini-2.5-flash-preview-05-20"',  // gemini-2.0-flash, gemini-2.5-pro
        model: 'gemini-1.5-pro-latest',
        contents: contents,
        config: config3
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
    // console.log("\nBot Response:", final_response.text);

    // state.tool = "general"
    state.response = true;
    state.responseText = final_response.text;
}

async function createEnquiry(state) {
    state.resultFuncCall = await createServiceEnquiryTool(state.service_code, state.prompt_label_text, state.token)

    state.tool = "general"
    state.service_code = null;
    state.request_number = state.resultFuncCall.request_number
    await functionToolResponse(state.functionCall, state.resultFuncCall)
}

async function chatBot(message, user_id, session_id, token) {
    state = getState(user_id, session_id, token);
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
                state.request_number = state.functionCall.args.request_number
                state.user_email = state.functionCall.args.hereglegchiin_email
                // botChat(state.functionCall.args.request_number)

                state.resultFuncCall = await sendEnquiryDataTool(state.request_number, state.user_email)
                await functionToolResponse(state.functionCall, state.resultFuncCall)

                state.tool = "general"
                state.request_number = null;
            }
        } else {
            state.response = true;
            state.responseText = response.text;
        }
    }
    else if (state.tool === "service-identify") {
        if (state.service_code != null) {
            state.tool = "service-create";
        }
        else if (state.service_suggest === true) {
            await getServiceCodeFromSuggestion(message, user_id)
            if (state.service_code != null) {
                state.tool = "service-create";
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

            if (serviceList.some(x => x.code === state.service_code && x.create === false)) {
                state.conversation.push({
                    role: 'user',
                    parts: [{ text: "Уучлаарай, энэ үйлчилгээг зөвхөн E-Mongolia вэб сайтаар авах боломжтой." }]
                });
                const response = await botGenerateContent2(state.conversation);

                console.log('response', response)
                state.response = true;
                state.responseText = response.text;
            }
            else if (state.prompt_label_type != null) {
                if (state.prompt_label_type === "answer") {
                    // await checkServiceReference(message, user_id)
                    await setPromptLabelData(message, user_id)

                    state.conversation.push({
                        role: 'user',
                        parts: [{ text: state.responseText }]
                    });
                    const response = await botGenerateContent2(state.conversation);

                    await getValueFromPrompt(response.text, state)

                    await createEnquiry(state)
                }
                else {
                    await setPromptLabelData(message, user_id)

                    state.conversation.push({
                        role: 'user',
                        parts: [{ text: state.responseText }]
                    });
                    const response = await botGenerateContent3(state.conversation);
                    state.response = true;
                    state.responseText = response.text;
                    state.prompt_label_type = "answer";
                }
            }
            else {

                await createEnquiry(state)
            }
        }
    }
}

await initializeAgentServiceIdentify();

export async function emaBot(message, user_id, session_id, token) {
    state = getState(user_id, session_id, token);

    try {
        while (state.response === false) {
            await chatBot(message, user_id, session_id, token)
        }
    } catch (error) {
        // Code to handle the error
        console.error("An error occurred:", error.message);
        state.responseText = "системд алдаа гарлаа."
    }

    state.response = false;
    return state.responseText;
}

// #endregion
