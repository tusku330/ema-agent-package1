import axios from "axios";
import 'dotenv/config';

export async function sendEnquiryDataTool(enquiry_number, email) {
    try {
        const requestBody = {
            "fromName": "И-Монгол чат бот",
            "from": "no-reply@e-mongolia.mn",
            "subject": "Лавлагааны баримт бичиг",
            "content": "",
            "to": email,
            "cc": email,
            "enquiryNumber": enquiry_number,
            "enquiryUrl": "null"
        }
        const response = await axios.post(process.env.ACTION_SEND_EMAIL_URL, requestBody);
        if (response.data && response.data.result) {
            return { result: response.data.result };
        } else {
            return { result: false, error: "failed to send to email." };
        }
    } catch (error) {
        console.error("error send to email: ", error.message);
        return { result: false, error: "имэйл илгээхэд алдаа гарлаа." };
    }
}

// const response = await sendEnquiryDataTool('J3VC-HHWF-RSDO-DDXZ', 'tusku8@gmail.com')
// console.log(response)