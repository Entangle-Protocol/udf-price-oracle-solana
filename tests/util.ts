import axios from "axios";

interface FeedValue {
    data: Buffer;
    timestamp: number;
}

interface Feed {
    key: string;
    value: FeedValue;
    merkleProofs: string[];
}

interface Signature {
    R: string;
    S: string;
    V: number;
}

interface Calldata {
    merkleRoot: string;
    signatures: Signature[];
    feeds: Feed[];
}


export interface UpdateResponse {
    calldata: Calldata;
    error: string;
}


export async function fetchPriceFeed(url: string): Promise<UpdateResponse> {
    try {
        console.log("url", url);
        const response = await axios.get<UpdateResponse>(url);
        const data = response.data;
        data.calldata.feeds = data.calldata.feeds.map(feed => ({
            ...feed,
            value: {
                ...feed.value,
                data: Buffer.from(feed.value.data, 'base64')
            }
        }));
        return data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Axios error:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
        } else {
            console.error('Unknown error:', error);
        }
        throw error;
    }
}