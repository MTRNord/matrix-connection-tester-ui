import { Panel, LoadingBox, Paragraph, ErrorSummary, Fieldset, Label, LabelText, HintText, Input, Button } from "govuk-react";
import createClient from "openapi-fetch";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { getConfig } from "../../api";
import type { paths } from "../../api/api";

function CreateAlertForm() {

    const { t } = useTranslation();
    const [errors, setErrors] = useState<{
        email?: string;
        server_name?: string;
        [key: string]: string | undefined;
    }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [serverName, setServerName] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Create alert
    const handleCreate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSuccess(null);

        // Validate input
        const newErrors: { [key: string]: string } = {};
        if (!email) newErrors.email = t("alerts.emailRequired") || "Email is required.";
        if (!serverName) newErrors.server_name = t("alerts.serverNameRequired") || "Server name is required.";
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            setIsSubmitting(false);
            return;
        }

        try {
            const API_SERVER_URL = (await getConfig()).api_server_url;
            const client = createClient<paths>({ baseUrl: API_SERVER_URL });
            const { error: regError } = await client.POST("/api/alerts/register", {
                body: { email: email, server_name: serverName },
            });
            if (regError) {
                setError(regError.toString() || "Failed to create alert.");
                return;
            }
            setEmail("");
            setServerName("");
            setSuccess(t("alerts.created") || "Alert created! Please check your email to verify.");

        } catch (e) {
            setSuccess(null);
            throw e;
        } finally {
            setIsSubmitting(false);
        }
    }, [email, serverName, t]);

    return (
        <>
            {success && <Panel
                title={t("alerts.createdTitle") || "Alert Created"}
            />}
            {!success && (
                <LoadingBox loading={isSubmitting}>
                    <Paragraph>
                        {t("alerts.info")}
                    </Paragraph>
                    {
                        Object.entries(errors).length > 0 ? (
                            <ErrorSummary
                                heading={t("alerts.createErrorSummary.title") || "Error creating alert"}
                                description={t("alerts.createErrorSummary.description") || "An error occurred while creating the alert."}
                                errors={Object.keys(errors).map((key) => ({
                                    targetName: key,
                                    text: errors[key]
                                }))} />
                        ) : null
                    }
                    {error && (
                        <ErrorSummary
                            heading={t("alerts.createErrorSummary.title") || "Error creating alert"}
                            description={t("alerts.createErrorSummary.description") || "An error occurred while creating the alert."}
                        />)
                    }
                    <form onSubmit={handleCreate}>
                        <Fieldset>
                            <Fieldset.Legend size="M">
                                {t("alerts.createTitle") || "Create Alert"}
                            </Fieldset.Legend>
                            <Label mb={4}>
                                <LabelText>
                                    {t("alerts.email") || "Email"}
                                </LabelText>
                                <HintText>
                                    {t("alerts.emailHint") || "Enter your email to receive alerts."}
                                </HintText>
                                <Input
                                    name="email"
                                    value={email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                    required
                                    type="email"
                                />
                            </Label>
                            <Label mb={4}>
                                <LabelText>
                                    {t("alerts.serverName") || "Server Name"}
                                </LabelText>
                                <HintText>
                                    {t("alerts.serverNameHint") || "Enter the server name to monitor."}
                                </HintText>
                                <Input
                                    name="server_name"
                                    value={serverName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServerName(e.target.value)}
                                    required
                                />
                            </Label>
                        </Fieldset>
                        <Button disabled={isSubmitting} type="submit">
                            {t("alerts.createTitle") || "Create Alert"}
                        </Button>
                    </form>
                </LoadingBox>
            )}
        </>
    );
}
export default React.memo(CreateAlertForm);