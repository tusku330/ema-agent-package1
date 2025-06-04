import axios from "axios";
import serviceList from '../datasets/emon_service_list_v1.json' with { type: 'json' };
import 'dotenv/config';

export async function createServiceEnquiryTool(service_code, formData, token) {
    try {
        if (serviceList.some(x => x.code === service_code)) {
            let body = {};
            if (!(formData === null || formData === undefined))
                body = formData

            const response = await axios.post(process.env.ACTION_SERVICE_CREATE_URL + "/" + service_code, body, {
                headers: {
                    //'Content-Type': 'application/json',
                    'token': token
                },
            })
            if (response.data && response.data) {
                return { request_number: response.data.data };
            } else {
                return { request_number: null, error: "api сервис дуудахад алдаа гарлаа." };
            }
        }
        else {
            return { request_number: null, error: service_code + " кодтой үйлчилгээ олдсонгүй." };
        }
    } catch (error) {
        console.log("Error calling enquiry API:", error.message);
        return { request_number: null, error: `failed to generate enquiry: ${error.response.data.message}` };
    }
}

// export async function createServiceEnquiryTool(service_code, formData) {
//     try {
//         if (serviceList.some(x => x.code === service_code)) {

//             let token = 'iQ+arKFoZ8oG85ft7RJ4vgz1DezMTiyBx/mfmbn6VSuhXcpGn1imZJo1WBLmJ51Kob3M/sUwrGzuHgsiCM24NYuVZ+KgIzw1tGMnlG4P1kN1qi+LEEOamYNsGu5PIeNruD6VXtC8IJIO8GePHRwSrhB2/hzGkW2SrPnQj2mnt/A='
//             const response = await axios.get("https://st.e-mongolia.mn/api/agent/service/" + service_code, {
//                 headers: {
//                     //'Content-Type': 'application/json',
//                     'token': token
//                 }
//             })
//             if (response.data && response.data) {
//                 return { request_number: response.data.data };
//             } else {
//                 return { request_number: null, error: "api сервис дуудахад алдаа гарлаа." };
//             }
//         }
//         else {
//             return { request_number: null, error: service_code + " кодтой үйлчилгээ олдсонгүй." };
//         }
//     } catch (error) {
//         console.log("Error calling enquiry API:", error.message);
//         return { request_number: null, error: `failed to generate enquiry: ${error.response.data.message}` };
//     }
// }

// const response = await createServiceEnquiryTool('632921c90ae1d271945eacea', {
//     "startYear": "2022",
//     "endYear": "2023"
// })
// console.log(response)