import axios from "axios";

const API_KEY = process.env.EXPO_PUBLIC_SINDRI_API_KEY || "";
const API_URL_PREFIX =
  process.env.EXPO_PUBLIC_SINDRI_API_URL_PREFIX || "https://sindri.app/api/";
const API_VERSION = "v1";
const API_URL = API_URL_PREFIX.concat(API_VERSION);
const CIRCUIT_ID = process.env.EXPO_PUBLIC_SINDRI_CIRCUIT_ID || "";

const headersJson = {
  Accept: "application/json",
  Authorization: `Bearer ${API_KEY}`,
};

const pollForStatus = async (endpoint, timeout = 20 * 60) => {
  for (let i = 0; i < timeout; i++) {
    const response = await axios.get(API_URL + endpoint, {
      headers: headersJson,
      validateStatus: (status) => status === 200,
    });

    const status = response.data.status;
    if (["Ready", "Failed"].includes(status)) {
      console.log(`Poll exited after ${i} seconds with status: ${status}`);
      return response;
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error(`Polling timed out after ${timeout} seconds.`);
};

const parseToml = (tomlString) => {
  const result = {};
  const lines = tomlString.split(/\r?\n/);

  lines.forEach((line) => {
    if (line.trim().startsWith("#") || line.trim() === "") return;
    const [key, value] = line.split("=").map((s) => s.trim());
    if (value === "true") {
      result[key] = true;
    } else if (value === "false") {
      result[key] = false;
    } else if (!isNaN(value)) {
      result[key] = Number(value);
    } else {
      result[key] = value;
    }
  });

  return result;
};

export const generateProof = async (input) => {
  try {
    const circuitId = CIRCUIT_ID;
    console.log("Proving circuit with id: ", circuitId);

    const proofInput = `input = ${input}`;
    console.log(proofInput);
    const proveResponse = await axios.post(
      API_URL + `/circuit/${circuitId}/prove`,
      { proof_input: proofInput },
      { headers: headersJson, validateStatus: (status) => status === 201 }
    );
    const proofId = proveResponse.data.proof_id;
    console.log("Proof id: ", proofId);

    const proofDetailResponse = await pollForStatus(`/proof/${proofId}/detail`);
    const proofDetailStatus = proveResponse.data.status;
    if (proofDetailStatus === "Failed") {
      throw new Error(
        `Proof generation failed. response: ${proofDetailResponse}`
      );
    }

    const proverTomlContent =
      proofDetailResponse.data.proof_input["Prover.toml"];
    const verifierTomlContent =
      proofDetailResponse.data.proof_input["Verifier.toml"];

    console.log("Prover.toml: ", proverTomlContent);
    console.log("Verifier.toml: ", verifierTomlContent);

    const publicOutput = verifierTomlContent;
    console.log("Circuit proof output signal: ", publicOutput);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("An unknown error occurred.");
    }
  }
};
