let session_store = []

export function clearData() {
    session_store = []
}

export function getData() {
    return session_store;
}

export function getState(user_id, session_id, token) {

    if (!session_store.some(x => x.user_id === user_id)) {
        addData(user_id, session_id, token)
    }
    const state = session_store.find(x => x.user_id === user_id);

    if (!(session_id === null || session_id === undefined) && state.session_id != session_id) {
        console.log("222 session_id ", session_id)
        refreshData(state, session_id, token)
    }

    return state;
}

function refreshData(state, session_id, token) {

    state.conversation = [];
    state.session_id = session_id;
    state.token = token
    state.response = false;
    state.responseText = "",
    state.functionCall = null;
    state.resultFuncCall = null;

    state.service_code = null;
    state.relevant_docs = null;
}

function addData(user_id, session_id, token) {
    const state = {
        user_id: user_id,
        session_id: session_id,
        token: token,
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
        relevant_docs: null,
        // ... any shared data

        service_create_ref: null,

        prompt_label_type: null,
        prompt_label_text: null,
        prompt_label_value: null,

    };
    session_store.push(state);
}
