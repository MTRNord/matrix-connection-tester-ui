import { useEffect, useState } from "react";
import { H1, LoadingBox, ErrorText } from "govuk-react";
import { useSearchParams } from "react-router";
import { getConfig } from "../api";
import createClient from "openapi-fetch";
import type { paths } from "../api/api";

export default function AlertVerify() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
    const [message, setMessage] = useState<string>("");
    const token = searchParams.get("token");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("No verification token provided.");
            return;
        }
        (async () => {
            try {
                const API_SERVER_URL = (await getConfig()).api_server_url;
                const client = createClient<paths>({ baseUrl: API_SERVER_URL });
                const { error } = await client.GET("/api/alerts/verify", {
                    params: { query: { token } },
                });
                if (!error) {
                    setStatus("success");
                    setMessage("Your alert was successfully verified!");
                } else {
                    setStatus("error");
                    setMessage(error instanceof Error ? error.message : "Verification failed.");
                }
            } catch (err) {
                setStatus("error");
                setMessage(`Network error during verification: ${err instanceof Error ? err.message : String(err)}`);
                console.error("Verification error:", err);
            }
        })();
    }, [token]);

    return (
        <div>
            <H1>Alert Verification</H1>
            {status === "pending" && <LoadingBox>Verifying your alert...</LoadingBox>}
            {status === "success" && <div style={{ color: "green", fontWeight: "bold" }}>{message}</div>}
            {status === "error" && <ErrorText>{message}</ErrorText>}
        </div>
    );
}
