import axios from "axios";


export async function sendEnquiryDataTool(enquiry_number, email) {
    try {
        //Example using axios (uncomment 'import axios' above)
        let requestBody = {
            "fromName": "И-Монгол чат бот",
            "from": "no-reply@e-mongolia.mn",
            "subject": "Лавлагааны pdf",
            "content": "",
            "to": email,
            "cc": email,
            "enquiryUrl": "https://st-cdn.e-mongolia.mn/api/files/entity/683811897e99e07c2a0aaed0"
            // "enquiryUrl": "https://st-cdn.e-mongolia.mn/uploads/112/enquiry/2025/5/29/68381189db626e775b576032_de291b2b-f1c5-4dcf-bae5-f84e87bdbb4b.pdf"
        }
        const response = await axios.post("https://sso.e-mongolia.mn/email-api/api/email/send-enquiry", requestBody);
        if (response.data && response.data.result) {
            return { result: response.data.result };
        } else {
            return { result: false, error: "Failed to send to email." };
        }
    } catch (error) {
        console.error("Error send to email: ", error.message);
        return { result: false, error: "имэйл илгээхэд алдаа гарлаа." };
    }
}

// const response = await sendEnquiryDataTool('5dbbaaa88575f952c5255106', 'tusku8@gmail.com')
// console.log(response)