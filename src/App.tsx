import { useState } from 'react';
import FederationResults from './FederationResults';
import { Button, ErrorSummary, FormGroup, H1, HintText, Input, Label, LabelText, LeadParagraph, SectionBreak } from 'govuk-react';
import { mutate } from 'swr';
import SupportInfo from './SupportInfo';
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  const [inputValue, setInputValue] = useState<string>('');
  const [submittedServerName, setSubmittedServerName] = useState<string>('');

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
      <H1>Matrix Connection Tester</H1>
      <LeadParagraph>
        This tool checks if a Matrix server is reachable and federates correctly with the wider Matrix network.
        Enter a server name to see if federation works, what software it runs, and detailed debug information about its configuration and connectivity.
      </LeadParagraph>

      <form
        onSubmit={handleSubmit}
        style={{ background: '#f3f2f1', padding: 24, margin: '24px 0' }}
      >
        <FormGroup>
          <Label>
            <LabelText>Server Name</LabelText>
            <HintText className="form-label">
              Enter the name of the Matrix server you want to query, e.g.: <code>matrix.org</code>
              <br />
              The server name is the part of the Matrix ID after the <code>@</code> symbol.
              For example, for <code>@alice:matrix.org</code>, the server name is <code>matrix.org</code>.
            </HintText>
            <Input
              name="serverName"
              value={inputValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
              autoFocus
              placeholder="example.com"
              required
              pattern="^[a-zA-Z0-9.\-]+$"
              title="Server name must be alphanumeric and can include dots and hyphens."
              aria-label="Server Name"
              style={{ maxWidth: 300 }}
            />
          </Label>
        </FormGroup>
        <Button start type="submit">Go</Button>
      </form>

      {submittedServerName && (
        <>
          <SectionBreak
            level="LARGE"
            visible
          />
          <ErrorBoundary fallback={
            <ErrorSummary
              heading="The UI failed to load"
              description='The component failed to load. Please contact the page admin'
            />
          }>
            <FederationResults serverName={submittedServerName} />
          </ErrorBoundary>
          <SectionBreak
            level="LARGE"
            visible
          />
          <ErrorBoundary fallback={
            <ErrorSummary
              heading="The UI failed to load"
              description='The component failed to load. Please contact the page admin'
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
