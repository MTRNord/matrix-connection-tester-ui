import { Suspense, useState } from 'react';
import FederationResults from './FederationResults';
import { ErrorBoundary } from 'react-error-boundary';
import { Button, ErrorText, FormGroup, H1, HintText, Input, Label, LabelText, LoadingBox, Paragraph, } from 'govuk-react';
import { mutate } from 'swr';

function App() {
  const [inputValue, setInputValue] = useState<string>('');
  const [submittedServerName, setSubmittedServerName] = useState<string>('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    mutate(trimmed, undefined, { revalidate: true });
    setSubmittedServerName(trimmed);
  };

  return (
    <>
      <H1>Matrix Connection Tester</H1>
      <Paragraph>
        This tool checks if a Matrix server is reachable and federates correctly with the wider Matrix network.
        Enter a server name to see if federation works, what software it runs, and detailed debug information about its configuration and connectivity.
      </Paragraph>

      <div style={{ background: '#f3f2f1', padding: 24, borderRadius: 6, margin: '24px 0' }}>
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
              pattern="^[a-zA-Z0-9.-]+$"
              title="Server name must be alphanumeric and can include dots and hyphens."
              aria-label="Server Name"
              style={{ maxWidth: 300 }}
            />
          </Label>
        </FormGroup>
        <Button onClick={handleSubmit}>Go</Button>
      </div>

      <hr style={{ margin: '32px 0' }} />

      <ErrorBoundary fallback={<ErrorText>⚠️ Something went wrong talking to the API</ErrorText>}>
        <Suspense fallback={
          <LoadingBox loading={true}>
            <Paragraph>⌛ Getting info from API…</Paragraph>
          </LoadingBox>
        }>
          {submittedServerName && (
            <FederationResults serverName={submittedServerName} />
          )}
        </Suspense>
      </ErrorBoundary>
    </>
  )
}

export default App
