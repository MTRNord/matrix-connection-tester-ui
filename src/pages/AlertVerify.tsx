import { useEffect, useState } from "react";
import { H1, LoadingBox, ErrorText, Button, Table, H2, Panel } from "govuk-react";
import { useSearchParams } from "react-router";
import { getConfig } from "../api";
import createClient from "openapi-fetch";
import type { paths, components } from "../api/api";

export default function AlertVerify() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
    const [message, setMessage] = useState<string>("");
    const [alerts, setAlerts] = useState<components["schemas"]["Model"][] | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
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
                const { data, error } = await client.GET("/api/alerts/verify", {
                    params: { query: { token } },
                });
                if (!error && data && "alerts" in data) {
                    setAlerts(data.alerts);
                    setStatus("success");
                    setMessage("Your alert was successfully verified!");
                } else if (!error) {
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

    const handleDelete = async (id: number) => {
        setDeleting(String(id));
        try {
            const API_SERVER_URL = (await getConfig()).api_server_url;
            const client = createClient<paths>({ baseUrl: API_SERVER_URL });
            const { error } = await client.DELETE("/api/alerts/{id}", {
                params: { path: { id: String(id) } },
            });
            if (!error) {
                setMessage("A verification email to delete this alert was sent. Please check your inbox to confirm deletion.");
            } else {
                alert(error instanceof Error ? error.message : "Failed to delete alert.");
            }
        } catch (err) {
            alert(`Network error during delete: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div>
            <H1>Alert Verification</H1>
            {status === "pending" && <LoadingBox>Verifying your alert...</LoadingBox>}
            {status === "success" && (
                <>
                    <Panel title={message} />
                    {alerts && alerts.length > 0 && (
                        <div>
                            <H2>Your Alerts</H2>
                            <Table>
                                <Table.Row>
                                    <Table.CellHeader>Server</Table.CellHeader>
                                    <Table.CellHeader>Email</Table.CellHeader>
                                    <Table.CellHeader>Verified</Table.CellHeader>
                                    <Table.CellHeader>Action</Table.CellHeader>
                                </Table.Row>
                                {alerts.map(alert => (
                                    <Table.Row key={alert.id}>
                                        <Table.Cell>{alert.server_name}</Table.Cell>
                                        <Table.Cell>{alert.email}</Table.Cell>
                                        <Table.Cell>{alert.verified ? "Yes" : "No"}</Table.Cell>
                                        <Table.Cell>
                                            <Button
                                                disabled={deleting === String(alert.id)}
                                                onClick={() => handleDelete(alert.id)}
                                                buttonColour="red"
                                                style={{ marginBottom: 0 }}
                                            >
                                                {deleting === String(alert.id) ? "Deleting..." : "Delete"}
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table>
                        </div>
                    )}
                </>
            )}
            {status === "error" && <ErrorText>{message}</ErrorText>}
        </div>
    );
}
