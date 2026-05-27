document
  .getElementById("checkBtn")
  .addEventListener("click", async () => {

    const news =
      document
        .getElementById("newsText")
        .value;

    if (news === "") {

      document
        .getElementById("result")
        .innerHTML =
        "Paste some news first";

      return;
    }

    document
      .getElementById("result")
      .innerHTML =
      "Checking...";

    try {

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

      const data = await response.json();

      document
        .getElementById("result")
        .innerHTML = `

        <div style="font-family: Arial;">

          <h3>Result</h3>

          <p>
            <strong>Verdict:</strong>
            ${data.verdict}
          </p>

          <p>
            <strong>Authenticity Score:</strong>
            ${data.authenticityScore}
          </p>

          <p>
            <strong>Confidence:</strong>
            ${data.confidenceScore}
          </p>

          <p>
            <strong>Bias Score:</strong>
            ${data.biasScore}
          </p>

          <p>
            <strong>Explanation:</strong><br>
            ${data.explanation}
          </p>

        </div>
      `;

    } catch (error) {

      console.error(error);

      document
        .getElementById("result")
        .innerHTML =
        "Backend Error";
    }

  });