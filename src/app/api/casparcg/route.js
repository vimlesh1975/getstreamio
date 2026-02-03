import { CasparCG, Options, AMCP } from 'casparcg-connection';

var aa = null;
if (aa === null) { aa = new CasparCG(process.env.CASPAR_HOST, 5250); }
aa.queueMode = Options.QueueMode.SEQUENTIAL;
aa.onConnectionChanged = () => {
    console.log('ServerConnectionStatus ' + aa.connected);
};

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