/**
 * SignNova NLP Sentence Reconstruction & Grammar Service
 * Converts raw detected ASL gloss tokens (words and numbers) into fluent,
 * grammatically complete English sentences using rule-based grammar heuristics
 * and optional AI/LLM API connectors.
 */

export class NLPSentenceService {
  constructor(config = {}) {
    this.apiKey = config.apiKey || "";
    this.aiModel = config.aiModel || "gemini-1.5-flash"; // or custom
    this.useAiMode = config.useAiMode || false;
    this.customEndpoint = config.customEndpoint || "";

    // Speech synthesis configuration
    this.speechRate = config.speechRate || 1.0;
    this.speechPitch = config.speechPitch || 1.0;
    this.selectedVoice = null;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        this.selectedVoice = voices.find(v => v.lang.startsWith("en") && !v.name.includes("Bad")) || voices[0];
      };
    }
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  setAiMode(enabled) {
    this.useAiMode = enabled;
  }

  /**
   * Main sentence reconstruction pipeline
   * @param {Array<string>} tokens Array of raw detected word/number tokens
   * @returns {Promise<{ sentence: string, gloss: string, confidence: number }>}
   */
  async reconstructSentence(tokens) {
    if (!tokens || tokens.length === 0) {
      return {
        sentence: "",
        gloss: "",
        confidence: 0
      };
    }

    // 1. Clean and deduplicate consecutive tokens
    const cleaned = this.deduplicateTokens(tokens);
    const gloss = cleaned.join(" ");

    // 2. If AI Mode is enabled and API key is present, attempt LLM reconstruction
    if (this.useAiMode && this.apiKey) {
      try {
        const aiSentence = await this.callAiTranslation(cleaned);
        if (aiSentence) {
          return {
            sentence: aiSentence,
            gloss,
            confidence: 0.98,
            source: "ai"
          };
        }
      } catch (err) {
        console.warn("AI translation fallback to heuristic engine:", err);
      }
    }

    // 3. Built-in High-Accuracy Grammar Engine
    const ruleSentence = this.applyASLGrammarRules(cleaned);
    return {
      sentence: ruleSentence,
      gloss,
      confidence: 0.92,
      source: "rule-engine"
    };
  }

  /**
   * Removes rapid accidental duplicate tokens
   */
  deduplicateTokens(tokens) {
    const res = [];
    for (let i = 0; i < tokens.length; i++) {
      const cur = tokens[i].trim().toUpperCase();
      if (!cur) continue;
      // Don't repeat if identical to immediate predecessor unless it's numbers
      if (res.length === 0 || res[res.length - 1] !== cur || !isNaN(Number(cur))) {
        res.push(cur);
      }
    }
    return res;
  }

  /**
   * Comprehensive ASL Grammar -> Fluent English rules
   */
  applyASLGrammarRules(tokens) {
    if (tokens.length === 0) return "";
    if (tokens.length === 1) {
      return this.formatSingleToken(tokens[0]);
    }

    const t = [...tokens];
    const upper = t.map(x => x.toUpperCase());

    // Check common high-frequency idioms & phrases
    const fullKey = upper.join(" ");

    const IDIOM_MAP = {
      "HELLO": "Hello!",
      "HELLO YOU": "Hello, how are you?",
      "HELLO HOW": "Hello! How are you doing?",
      "THANK YOU": "Thank you very much!",
      "THANK YOU FRIEND": "Thank you, my friend!",
      "PLEASE HELP": "Please help me.",
      "HELP PLEASE": "Please help me.",
      "PLEASE HELP ME": "Could you please help me?",
      "I NEED HELP": "I need some help, please.",
      "I NEED HELP PLEASE": "I need some help, please.",
      "I LOVE YOU": "I love you!",
      "NICE TO MEET YOU": "It is nice to meet you!",
      "NICE MEET YOU": "Nice to meet you!",
      "YOU NAME WHAT": "What is your name?",
      "WHAT YOU NAME": "What is your name?",
      "WHERE WATER": "Where can I find water?",
      "WHERE BATHROOM": "Where is the restroom located?",
      "I WANT EAT": "I would like something to eat.",
      "I WANT FOOD": "I would like some food.",
      "I WANT WATER": "I would like some water to drink.",
      "I THIRSTY WATER": "I am thirsty and need some water.",
      "STOP WAIT": "Please stop and wait a moment.",
      "YES I UNDERSTAND": "Yes, I understand clearly.",
      "NO I UNDERSTAND": "No, I do not understand.",
      "NO NOT UNDERSTAND": "No, I don't understand.",
      "AGAIN PLEASE": "Could you please say or sign that again?",
      "HOW YOU": "How are you doing?",
      "I HAPPY": "I am feeling happy!",
      "I SAD": "I am feeling sad.",
      "I TIRED": "I am feeling tired.",
      "GOOD MORNING": "Good morning!"
    };

    if (IDIOM_MAP[fullKey]) {
      return IDIOM_MAP[fullKey];
    }

    // Question formulation
    const hasWhat = upper.includes("WHAT");
    const hasWhere = upper.includes("WHERE");
    const hasHow = upper.includes("HOW");
    const hasQuestion = hasWhat || hasWhere || hasHow;

    // Politeness markers
    const hasPlease = upper.includes("PLEASE");
    const hasThankYou = upper.includes("THANK YOU");

    // Remove politeness from core syntax pass
    const core = upper.filter(x => x !== "PLEASE" && x !== "THANK YOU");

    let rebuilt = [];
    let i = 0;

    while (i < core.length) {
      const token = core[i];
      const next = core[i + 1] || null;

      // Number quantification: [3] [WATER] -> "three bottles of water"
      if (!isNaN(Number(token)) && next) {
        const numWord = this.numberToWord(Number(token));
        if (next === "WATER") {
          rebuilt.push(`${numWord} glasses of water`);
          i += 2;
          continue;
        } else if (next === "EAT" || next === "FOOD") {
          rebuilt.push(`${numWord} meals`);
          i += 2;
          continue;
        } else {
          rebuilt.push(`${numWord} ${next.toLowerCase()}s`);
          i += 2;
          continue;
        }
      }

      // Pronoun + Verb expansions
      if (token === "I") {
        if (next === "WANT") {
          rebuilt.push("I would like");
          i += 2;
          continue;
        } else if (next === "NEED") {
          rebuilt.push("I need");
          i += 2;
          continue;
        } else if (next === "LOVE") {
          rebuilt.push("I love");
          i += 2;
          continue;
        } else if (next === "HAPPY" || next === "SAD" || next === "GOOD" || next === "TIRED") {
          rebuilt.push(`I am ${next.toLowerCase()}`);
          i += 2;
          continue;
        } else {
          rebuilt.push("I");
          i += 1;
          continue;
        }
      }

      if (token === "YOU") {
        if (hasQuestion && hasHow) {
          rebuilt.push("are you");
        } else {
          rebuilt.push("you");
        }
        i += 1;
        continue;
      }

      if (token === "EAT" || token === "FOOD") {
        rebuilt.push(rebuilt.length > 0 && rebuilt[rebuilt.length - 1].includes("like") ? "to eat" : "food");
        i += 1;
        continue;
      }

      if (token === "WATER") {
        rebuilt.push("some water");
        i += 1;
        continue;
      }

      // Default
      rebuilt.push(token.toLowerCase());
      i += 1;
    }

    // Reconstruct with grammar flow
    let sentence = rebuilt.join(" ").trim();

    // Questions restructuring
    if (hasWhat) {
      sentence = `What is ${sentence.replace(/what/gi, "").trim()}?`;
    } else if (hasWhere) {
      sentence = `Where is ${sentence.replace(/where/gi, "").trim()}?`;
    } else if (hasHow) {
      sentence = `How ${sentence.replace(/how/gi, "").trim()}?`;
    }

    // Politeness wrappers
    if (hasPlease) {
      sentence = `Please ${sentence.toLowerCase()}`;
    }
    if (hasThankYou) {
      sentence = `${sentence}, thank you!`;
    }

    // Clean up double spaces and capitalize
    sentence = sentence.replace(/\s+/g, " ").trim();
    if (sentence.length > 0) {
      sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
      if (!sentence.endsWith(".") && !sentence.endsWith("?") && !sentence.endsWith("!")) {
        sentence += ".";
      }
    }

    return sentence;
  }

  formatSingleToken(token) {
    const t = token.toUpperCase();
    if (t === "HELLO") return "Hello!";
    if (t === "THANK YOU") return "Thank you!";
    if (t === "PLEASE") return "Please.";
    if (t === "SORRY") return "I am sorry.";
    if (t === "YES") return "Yes.";
    if (t === "NO") return "No.";
    if (t === "HELP") return "Help me, please.";
    if (t === "I LOVE YOU") return "I love you!";
    if (t === "WATER") return "I need water.";
    if (t === "EAT") return "I want to eat.";
    if (t === "STOP") return "Please stop.";
    if (!isNaN(Number(t))) return `The number is ${t}.`;
    return `${token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()}.`;
  }

  numberToWord(n) {
    const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    return words[n] || String(n);
  }

  /**
   * Optional LLM Translation API Caller (Gemini / OpenAI compatible)
   */
  async callAiTranslation(tokens) {
    if (!this.apiKey) return null;

    const gloss = tokens.join(" ");
    const prompt = `Convert the following American Sign Language (ASL) gloss sequence into a fluent, natural, grammatically correct English sentence. Only respond with the final sentence.
ASL Gloss: ${gloss}
English Sentence:`;

    // Try Google Gemini API endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 60 }
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) throw new Error(`AI API error: ${resp.status}`);
    const data = await resp.json();
    const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return candidate || null;
  }

  /**
   * Play spoken audio via Web Speech API Text-to-Speech
   */
  speak(text) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported in this browser.");
      return;
    }

    if (!text || text.trim() === "") return;

    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.speechRate;
    utterance.pitch = this.speechPitch;
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    window.speechSynthesis.speak(utterance);
  }
}
