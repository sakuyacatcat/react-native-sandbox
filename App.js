import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { generateProof } from "./Sindri";

export default function App() {
  const [age, setAge] = useState("");
  const [proofResult, setProofResult] = useState("");

  const handleGenerateProof = async () => {
    try {
      const result = await generateProof(age);
      setProofResult("年齢が証明されました");
    } catch (error) {
      setProofResult("年齢が証明できませんでした");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="年齢を入力"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />
      <Button title="証明する" onPress={handleGenerateProof} />
      {proofResult ? <Text>{proofResult}</Text> : null}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 8,
    width: "80%",
  },
});
