import { pipeline, cos_sim } from '@xenova/transformers';
import serviceList from '../datasets/emon_service_list_v1.json' with { type: 'json' };
import { getState } from '../component/session_store.js';


// === CONFIG ===
const EMBEDDING_MODEL = 'Xenova/LaBSE';

// === Mongolian Text Normalization ===
const normalizeMongolian = (text) => {
    return text
        .replace(/\s+/g, ' ')           // collapse multiple spaces
        .replace(/[“”„«»]/g, '"')       // normalize quotes
        .replace(/[‘’‚]/g, "'")         // normalize apostrophes
        .trim();
};

// === Load Embedding Pipeline ===
let embeddingPipeline = null;
const getEmbeddingPipeline = async () => {
    if (!embeddingPipeline) {
        console.log(`Loading embedding model ('${EMBEDDING_MODEL}')...`);
        embeddingPipeline = await pipeline('feature-extraction', EMBEDDING_MODEL);
        console.log("Model loaded.");
    }
    return embeddingPipeline;
};

// === Generate Embedding ===
const generateEmbedding = async (text) => {
    const pipe = await getEmbeddingPipeline();
    const cleanedText = normalizeMongolian(text);
    const output = await pipe(cleanedText, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
};

// === Cosine Similarity ===
const cosSim = (a, b) => {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (magA * magB);
};

// === Knowledge Base ===
const knowledgeBase = serviceList;

// === Embed KB ===
let kbEmbeddings = [];
const embedKnowledgeBase = async () => {
    console.log("Embedding Knowledge Base...");
    const pipe = await getEmbeddingPipeline();
    kbEmbeddings = await Promise.all(
        knowledgeBase.map(async (doc) => {
            const embedding = await generateEmbedding(doc.text);
            return { ...doc, embedding };
        })
    );
};

// === Retrieve Relevant Docs ===
const retrieveRelevantDocuments = async (query, topK = 2) => {
    const queryEmbedding = await generateEmbedding(query);
    const scored = kbEmbeddings.map(doc => ({
        ...doc,
        score: cosSim(queryEmbedding, doc.embedding),
    }));

    return scored.filter(doc => doc.score > 0.7).sort((a, b) => b.score - a.score).slice(0, topK);
};

export async function initializeAgentServiceIdentify() {
    if (kbEmbeddings.length < 1)
        await embedKnowledgeBase();
}

export async function getServiceCodeFromSuggestion(user_input, user_id) {
    const state = getState(user_id);

    if (!isNaN(user_input)) {
        const number = Number(user_input);
        console.log("You entered a number:", number);

        const userServices = state.relevant_docs.filter(x => x.id === number);
        if (userServices.length === 0) {
            console.log("Үйлчилгээ олдсонгүй та дахин сонголт хийнээ уу.");
            state.service_code = null;
            state.service_suggest = true;

            state.response = true;
            state.responseText = "Үйлчилгээ олдсонгүй та дахин сонголт хийнээ уу.";
        }
        else {
            //console.log("Үйлчилгээ олдсонгүй та дахин сонгоно уу.");
            console.log("Таны сонгосон үйлчилгээний код: " + userServices[0].code)
            state.service_code = userServices[0].code;
            state.service_suggest = false;
            state.response = false;
        }
    } else {
        console.log("Та зөв сонголт хийнээ уу.");
    }
}

export async function getServiceCodeByName(service_name, user_id) {
    const state = getState(user_id);

    if (service_name != null || service_name != undefined) {
        state.relevant_docs = await retrieveRelevantDocuments(service_name, 2);

        let serviceSuggestList = "";
        if (state.relevant_docs.length > 0) {
            state.relevant_docs = state.relevant_docs.map((doc, index) => {
                doc.id = index + 1;
                serviceSuggestList += doc.id + ". " + doc.text + "; \n";
                return doc;
            });

            state.service_suggest = true;
            // console.log("Та аль үйлчилгээг сонирхож байна вэ? \n" + serviceSuggestList)

            state.response = true;
            state.responseText = "Та аль үйлчилгээг сонирхож байна вэ? \n" + serviceSuggestList;
        }
        else {
            state.service_suggest = false;
            // console.log(service_name, " нэртэй үйлчилгээ байхгүй байна. \n")

            state.response = true;
            state.responseText = service_name, " нэртэй үйлчилгээ байхгүй байна. \n";
        }
    }
}



// console.log('kbEmbeddings ', kbEmbeddings)
// await getServiceCode('Иргэний үнэмлэхийн лавлагаа')