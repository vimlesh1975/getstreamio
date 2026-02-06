import { Suspense } from "react";
import CallerWithToken from "./CallerWithToken";

export const dynamic = "force-dynamic";

export default function Page() {
    return (
        <Suspense fallback={null}>
            <CallerWithToken />
        </Suspense>
    );
}
