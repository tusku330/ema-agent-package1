import axios from "axios";
import serviceList from './component/emon.service.agent.json' with { type: 'json' };


export async function createServiceEnquiryTool(service_code) {
    try {
        if (serviceList.some(x => x.code === service_code)) {
            let token = 'TSHZ6qfKVIy51l80oiYU%2BAIbvqLIVYN2EsPcedP03n9%2Fqq8sQ2BaZnqL75qDQx%2FHnHvx6x4qcZs9%2FkWPW0or54JhtEKneBlL93Mou%2ByUr5LNFrIud75CW%2BjbCim%2FZGgaagsd04asv9AwEr8aNSbCVldO3Y7HgJDw2qKu2dZJ1CQ%3D'
            // const response = await axios.get("https://st.e-mongolia.mn/api/agent/enquiry?code=" + service_code + '&regnum=' + token);
            const response = await axios.get("https://st.e-mongolia.mn/api/agent/enquiry?code=5d8b15c33666c358f659b2f6" + '&regnum=' + token);
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
        // return { enquiry_number: null, error: `Failed to generate enquiry: ${error.response.data.message}` };
        return { request_number: null, error: `Failed to generate enquiry: ${error.response.data.message}` };
    }
}

// const response = await createServiceEnquiryTool('5dbbaaa88575f952c5255106')
// console.log(response)