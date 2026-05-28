document
  .getElementById("checkBtn")
  .addEventListener("click", async () => {

    const news = document
      .getElementById("newsText")
      .value
      .trim();

    if (news === "") {

      document
        .getElementById("result")
        .innerHTML = "Paste some news first";

      return;
    }

    document
      .getElementById("result")
      .innerHTML = "Checking...";

    try {

      // USE THE EXACT ENDPOINT FROM FASTAPI DOCS
      const response = await fetch(
        "http://127.0.0.1:8000/analyze-text",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            text: news
          })
        }
      );

      // SHOW BACKEND ERROR IF REQUEST FAILS
      if (!response.ok) {

        const errorText = await response.text();

        document
          .getElementById("result")
          .innerHTML = `
            <div style="color:red;">
              HTTP ${response.status}<br><br>
              ${errorText}
            </div>
          `;

        return;
      }

      const data = await response.json();

      document
        .getElementById("result")
        .innerHTML = `

        <div style="font-family: Arial; color: white;">

          <h3>Result</h3>

          <p>
            <strong>Verdict:</strong>
            ${data.verdict || "N/A"}
          </p>

          <p>
            <strong>Authenticity Score:</strong>
            ${data.authenticityScore || "N/A"}
          </p>

          <p>
            <strong>Confidence:</strong>
            ${data.confidenceScore || "N/A"}
          </p>

          <p>
            <strong>Bias Score:</strong>
            ${data.biasScore || "N/A"}
          </p>

          <p>
            <strong>Explanation:</strong><br>
            ${data.explanation || "No explanation available"}
          </p>

        </div>
      `;

    } catch (error) {

      console.error("Backend Error:", error);

      document
        .getElementById("result")
        .innerHTML = `
          <div style="color:red;">
            Failed to connect to backend<br><br>
            ${error.message}
          </div>
        `;
    }

  });