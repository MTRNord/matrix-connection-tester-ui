import { Button, ErrorSummary, Fieldset, HintText, Input, Label, LabelText, LoadingBox, Panel, Paragraph } from "govuk-react";
import React, { useCallback, useState } from "react";
import { getConfig } from "../../api";
import createClient from "openapi-fetch";
import type { paths } from "../../api/api";
import { useTranslation } from "react-i18next";

function CheckAlerts() {
    const { t } = useTranslation();
    const [errors, setErrors] = useState<{
        email?: string;
        server_name?: string;
        [key: string]: string | undefined;
    }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);


    const handleList = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSuccess(null);

        // Validate input
        const newErrors: { [key: string]: string } = {};
        if (!email) newErrors.email = t("alerts.emailRequired") || "Email is required.";
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            setIsSubmitting(false);
            return;
        }

        try {
            const API_SERVER_URL = (await getConfig()).api_server_url;
            const client = createClient<paths>({ baseUrl: API_SERVER_URL });
            const { error: regError } = await client.POST("/api/alerts/list", {
                body: { email },
            });
            if (regError) {
                setError(regError.toString() || "Failed to create verification email for listing alerts.");
                return;
            }
            setEmail("");
            setSuccess(t("alerts.verificationSent") || "Verification email sent! Please check your inbox to view your alerts.");

        } catch (e) {
            setSuccess(null);
            throw e;
        } finally {
            setIsSubmitting(false);
        }
    }, [email, t]);
    return (
        <>
            <Paragraph>
                {t("alerts.checkInfo") || "To get a list of your alerts we need to know your email. After that you get a verification email.\nClicking that link will show you the existing alerts you subscribed to and allows you to unsubscribe from them."}
            </Paragraph>
            {success && <Panel
                title={t("alerts.verificationSent") || "Verification email sent!"}
            />}
            {!success && (<LoadingBox loading={isSubmitting}>
                {
                    Object.entries(errors).length > 0 ? (
                        <ErrorSummary
                            heading={t("alerts.checkErrorSummary.title") || "Error checking alerts"}
                            description={t("alerts.checkErrorSummary.description") || "An error occurred while checking alerts."}
                            errors={Object.keys(errors).map((key) => ({
                                targetName: key,
                                text: errors[key]
                            }))} />
                    ) : null
                }
                {error && (
                    <ErrorSummary
                        heading={t("alerts.checkErrorSummary.title") || "Error checking alerts"}
                        description={t("alerts.checkErrorSummary.description") || "An error occurred while checking alerts."}
                    />)
                }
                <form onSubmit={handleList}>
                    <Fieldset>
                        <Fieldset.Legend size="M">
                            {t("alerts.checkTitle") || "Check Alerts"}
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
                    </Fieldset>
                    <Button disabled={isSubmitting} type="submit">
                        {t("alerts.checkTitle") || "Check Alerts"}
                    </Button>
                </form>
            </LoadingBox>)}
        </>
    )
}

export default React.memo(CheckAlerts);