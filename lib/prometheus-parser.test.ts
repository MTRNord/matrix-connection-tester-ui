import { assertEquals } from "jsr:@std/assert";
import { getMetricSamples, parsePrometheusText } from "./prometheus-parser.ts";

Deno.test("parsePrometheusText - basic metric parsing", () => {
  const input = `# HELP test_metric A test metric
# TYPE test_metric counter
test_metric{label1="value1",label2="value2"} 42
test_metric{label1="value3",label2="value4"} 100
`;

  const result = parsePrometheusText(input);
  const samples = getMetricSamples(result, "test_metric");

  assertEquals(samples.length, 2);
  assertEquals(samples[0].value, 42);
  assertEquals(samples[0].labels.label1, "value1");
  assertEquals(samples[0].labels.label2, "value2");
  assertEquals(samples[1].value, 100);
  assertEquals(samples[1].labels.label1, "value3");
});

Deno.test("parsePrometheusText - metric filtering", () => {
  const input = `# HELP metric1 First metric
# TYPE metric1 counter
metric1{label="a"} 1
# HELP metric2 Second metric
# TYPE metric2 counter
metric2{label="b"} 2
# HELP metric3 Third metric
# TYPE metric3 counter
metric3{label="c"} 3
`;

  const result = parsePrometheusText(input, ["metric1", "metric3"]);

  assertEquals(getMetricSamples(result, "metric1").length, 1);
  assertEquals(getMetricSamples(result, "metric2").length, 0);
  assertEquals(getMetricSamples(result, "metric3").length, 1);
});

Deno.test("parsePrometheusText - labels with escaped quotes", () => {
  const input = `test_metric{label="value\\"with\\"quotes"} 123`;

  const result = parsePrometheusText(input);
  const samples = getMetricSamples(result, "test_metric");

  assertEquals(samples.length, 1);
  assertEquals(samples[0].labels.label, 'value"with"quotes');
});

Deno.test("parsePrometheusText - labels with commas", () => {
  const input =
    `test_metric{label1="value1",label2="value2",label3="value3"} 456`;

  const result = parsePrometheusText(input);
  const samples = getMetricSamples(result, "test_metric");

  assertEquals(samples.length, 1);
  assertEquals(samples[0].labels.label1, "value1");
  assertEquals(samples[0].labels.label2, "value2");
  assertEquals(samples[0].labels.label3, "value3");
  assertEquals(samples[0].value, 456);
});

Deno.test("parsePrometheusText - metric without labels", () => {
  const input = `test_metric 789`;

  const result = parsePrometheusText(input);
  const samples = getMetricSamples(result, "test_metric");

  assertEquals(samples.length, 1);
  assertEquals(samples[0].value, 789);
  assertEquals(Object.keys(samples[0].labels).length, 0);
});

Deno.test("parsePrometheusText - scientific notation", () => {
  const input = `test_metric{label="value"} 1.23e+10`;

  const result = parsePrometheusText(input);
  const samples = getMetricSamples(result, "test_metric");

  assertEquals(samples.length, 1);
  assertEquals(samples[0].value, 1.23e+10);
});

Deno.test("parsePrometheusText - federation request total simulation", () => {
  const input = `# HELP federation_request_total Total federation requests
# TYPE federation_request_total counter
federation_request_total{server="matrix.org",software_family="Synapse",software_version="1.95.0",result="success"} 100
federation_request_total{server="mozilla.org",software_family="Dendrite",software_version="0.13.0",result="success"} 50
federation_request_total{server="example.com",software_family="Unknown",software_version="unknown",result="failure"} 5
federation_request_total{server="test.org",software_family="Conduit",software_version="0.6.0",result="success"} 75
`;

  const result = parsePrometheusText(input, ["federation_request_total"]);
  const samples = getMetricSamples(result, "federation_request_total");

  assertEquals(samples.length, 4);

  const synapseSample = samples.find((s) =>
    s.labels.software_family === "Synapse"
  );
  assertEquals(synapseSample?.value, 100);
  assertEquals(synapseSample?.labels.server, "matrix.org");
  assertEquals(synapseSample?.labels.result, "success");

  const unknownSample = samples.find((s) =>
    s.labels.software_family === "Unknown"
  );
  assertEquals(unknownSample?.value, 5);
  assertEquals(unknownSample?.labels.result, "failure");
});

Deno.test("parsePrometheusText - empty input", () => {
  const result = parsePrometheusText("");
  assertEquals(Object.keys(result.metrics).length, 0);
});

Deno.test("parsePrometheusText - comments only", () => {
  const input = `# This is a comment
# Another comment
`;
  const result = parsePrometheusText(input);
  assertEquals(Object.keys(result.metrics).length, 0);
});

Deno.test("parsePrometheusText - labels with spaces", () => {
  const input = `test_metric{ label1 = "value1" , label2 = "value2" } 999`;

  const result = parsePrometheusText(input);
  const samples = getMetricSamples(result, "test_metric");

  assertEquals(samples.length, 1);
  assertEquals(samples[0].labels.label1, "value1");
  assertEquals(samples[0].labels.label2, "value2");
  assertEquals(samples[0].value, 999);
});
