import serviceList from '../datasets/emon.service.agent.json' with { type: 'json' };
import { getState } from '../component/session_store.js';


export async function setPromptLabelData(message, user_id) {
    const state = getState(user_id);

    if (state.prompt_label_type != null) {
        if (state.prompt_label_type != null && state.prompt_label_type === "answer") {

            state.responseText = `Та бол ангилагч. Хэрэглэгчийн оролтыг өмнөх асуултын хариулт мөн үү, шинэ асуулт/сэдэв үү, эсвэл өөр зүйл үү гэдгийг тодорхойлно уу.

**Одоогийн асуулт:** "${state.responseText}"
**Хүлээгдэж буй хариултын төрөл/утга:** '4 оронтой жил, эхлэх дуусах огноо 2020-2025'

**Хэрэглэгчийн оролт:** "${message}"

**Гаралтыг дараах JSON форматаар өгнө үү:**
* **Хэрэв одоогийн асуултын хариулт мөн бол:** "{"type": "answer", "startYear": "хариултын_утга эхлэх огноо", "endYear": "хариултын_утга дуусах огноо"}"
* **Хэрэв шинэ асуулт эсвэл өөр сэдэв мөн бол:** "{"type": "other"}"`;


            // * **Хэрэв одоогийн асуултын хариулт мөн бол:** "{"type": "answer", "value": "хариултын_утга"}"

            console.log("ref_text ", state.responseText)
        }
        else {
            const serviceData = serviceList.find(x => x.code === state.service_code);
            if (serviceData.requirement != null && serviceData.requirement === "year") {
                //   state.responseText = "'Та жил оруулна уу:' гэж асуу";
                state.responseText = "'Эхлэх, дуусах огноо оруулна уу:' гэж асуу";
            }
        }
    }
}

export async function getValueFromPrompt(response, state) {

    console.log("response", response)
    let text = response.trim();
    // Remove ```json and ``` if present
    if (text.startsWith("```")) {
        text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }
    const obj = JSON.parse(text);
    if (obj.type === "answer") {
        console.log(obj.value);
        state.prompt_label_value = obj.value;
        state.prompt_label_text = obj;
        return obj.value;
    }
    else
        return null;
}

// const response = await createServiceEnquiryTool('5d8b13383666c358f659b2ee')
// console.log(response)