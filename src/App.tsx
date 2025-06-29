import { useEffect, useState } from 'react';
import ServerInfoResults from './ServerInfoResults';
import { Button, ErrorSummary, FormGroup, H1, HintText, Input, InsetText, Label, LabelText, LeadParagraph, SectionBreak } from 'govuk-react';
import { mutate } from 'swr';
import SupportInfo from './SupportInfo';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation, Trans } from 'react-i18next';

function App() {
  const [inputValue, setInputValue] = useState<string>('');
  const [submittedServerName, setSubmittedServerName] = useState<string>('');
  const { t } = useTranslation();

  // Read serverName from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const serverName = params.get('serverName');
    if (serverName) {
      setInputValue(serverName);
      setSubmittedServerName(serverName);
    }
  }, []);

  // Update URL when submittedServerName changes
  useEffect(() => {
    if (submittedServerName) {
      const params = new URLSearchParams(window.location.search);
      params.set('serverName', submittedServerName);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [submittedServerName]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    mutate(['federation', trimmed], undefined, { revalidate: true });
    mutate(['support', trimmed], undefined, { revalidate: true });
    setSubmittedServerName(trimmed);
  };

  return (
    <>
      <H1>{t('app.title')}</H1>
      <LeadParagraph>
        {t('app.description')}
      </LeadParagraph>

      <InsetText>
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>
              <LabelText>{t('app.form.serverName')}</LabelText>
              <HintText className="form-label">
                <Trans i18nKey="app.form.hint" components={{ code: <code /> }} />
              </HintText>
              <Input
                name="serverName"
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                placeholder={t('app.form.placeholder')}
                required
                pattern="^[a-zA-Z0-9.\-]+(:[0-9]+)?$"
                title={t('app.form.title')}
                aria-label={t('app.form.ariaLabel')}
                style={{ maxWidth: 300 }}
              />
            </Label>
          </FormGroup>
          <Button start type="submit">{t('app.form.goButton')}</Button>
        </form>
      </InsetText>

      {submittedServerName && (
        <>
          <SectionBreak
            level="LARGE"
            visible
          />
          <ErrorBoundary fallback={
            <ErrorSummary
              heading={t('app.errors.uiFailedToLoad')}
              description={t('app.errors.componentFailedToLoad')}
            />
          }>
            <ServerInfoResults serverName={submittedServerName} />
          </ErrorBoundary>
          <SectionBreak
            level="LARGE"
            visible
          />
          <ErrorBoundary fallback={
            <ErrorSummary
              heading={t('app.errors.uiFailedToLoad')}
              description={t('app.errors.componentFailedToLoad')}
            />
          }>
            <SupportInfo serverName={submittedServerName} />
          </ErrorBoundary>
        </>
      )}
    </>
  )
}

export default App
