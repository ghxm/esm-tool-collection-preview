$(document).ready(function() {
  console.log("Document fully loaded!");

  // Zeige eine Nachricht oben auf der Seite an, dass der JavaScript-Code auf die HTML zugreifen kann
  const debugContainer = document.createElement('div');
  debugContainer.style.backgroundColor = 'lightgreen';
  debugContainer.style.padding = '10px';
  debugContainer.style.textAlign = 'center';
  debugContainer.innerHTML = "<strong>Ich kann auf die HTML zugreifen</strong>";
  document.body.insertBefore(debugContainer, document.body.firstChild);  // Füge die Nachricht oben auf der Seite hinzu

  // Funktion zum Aktualisieren der Sichtbarkeit basierend auf den Daten
  function updateVisibility(data) {
    console.log("Executing updateVisibility function with data:", data);

    // Überprüfe, ob Elemente mit der Klasse "if_" vorhanden sind
    document.querySelectorAll('[class^="if_"]').forEach(element => {
      const className = Array.from(element.classList)
        .find(cls => cls.startsWith('if_'));

      if (!className) return;

      const condition = className.replace('if_', ''); // Hole den Condition-Teil der Klasse

      console.log(`Checking element:`, element);
      console.log(`Condition: ${condition}, Value in data: ${data[condition]}`);

      // Setze die Sichtbarkeit entsprechend der Bedingung
      if (data[condition]) {
        element.style.cssText = `
          display: block !important; 
          visibility: visible !important;
          opacity: 1 !important;
        `;
        element.querySelectorAll('*').forEach(child => {
          child.style.cssText = `
            display: inherit !important;
            visibility: visible !important;
            opacity: 1 !important;
          `;
        });
      } else {
        element.style.cssText = `
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        `;
        element.querySelectorAll('*').forEach(child => {
          child.style.cssText = `
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          `;
        });
      }
    });
  }

  // Empfang von Nachrichten aus Shiny
  Shiny.addCustomMessageHandler("javascript", function(data) {
    console.log("Received data from Shiny:", data);
    console.log("Data structure:", JSON.stringify(data, null, 2));
    updateVisibility(data); // Rufe die updateVisibility-Funktion auf
  });
});
