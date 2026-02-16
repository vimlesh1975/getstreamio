import { CasparCG, Options, AMCP } from 'casparcg-connection';
import { NextResponse } from 'next/server';

var aa = null;
if (aa === null) { aa = new CasparCG(process.env.CASPAR_HOST, 5250); }
aa.queueMode = Options.QueueMode.SEQUENTIAL;
aa.onConnectionChanged = () => {
    console.log('ServerConnectionStatus ' + aa.connected);
};

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*', // Or your specific online domain
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

export async function POST(req) {
    const body = await req.json();
    // console.log(body)
    if (body.action === 'endpoint') {
        if (aa) {
            try {
                aa.do(new AMCP.CustomCommand(body.command));
            } catch (error) {
            }
        }
        return new Response('');
    }
    return new Response('');
}