export const session_store = []

export function getState(user_id) {

    if (session_store.some(x => x.user_id === user_id)) {
        //const state = 
        return session_store.find(x => x.user_id === user_id);
    }
    else {
        const state = {
            user_id: user_id,
            tool: "general",    // genaral, service-identify, service-create, send-email
            conversation: [],
            response: false,
            responseText: "",
        
            functionCall: null,
            resultFuncCall: null,
        
            request_number: null,
            user_email: null,
        
            //service suggest tool's state
            service_code: null,
            service_suggest: false,
            relevant_docs: null
            // ... any shared data
        };
        session_store.push(state);
        // return state;
        return session_store.find(x => x.user_id === user_id);
    }
}
