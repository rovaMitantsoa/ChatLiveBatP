// Générer un identifiant unique pour le client
const clientId = localStorage.getItem('clientId') || uuid.v4();
localStorage.setItem('clientId', clientId); // Stocker l'identifiant dans le stockage local

// Connecter au serveur WebSocket en envoyant l'identifiant unique
const socket = new WebSocket('ws://localhost:8081?clientId=' + clientId);

socket.addEventListener('open', (event) => {
    console.log('WebSocket connection opened:', event);
});

// Affiche les images et les messages de l'admin ou du client dans la zone de discussion
socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    const adminMessage = data.adminMessage;
    const messageType = data.type;
    const messageContent = data.content;

    // Vérifier le type du message
    if (messageType === 'image') {
        console.log("Received image content:", messageContent);// Vérifiez le contenu de l'image dans la console
        // Créer un nouvel élément img
        const imgElement = document.createElement('img');
        // Définir l'attribut src avec les données de l'image base64
        imgElement.src = 'data:image/jpg;base64,' + messageContent;
        // Ajouter l'élément img au messageLog
        const messageLog = document.getElementById('messageLog');
        messageLog.appendChild(imgElement);

    } if (adminMessage) {
        const messageLog = document.getElementById('messageLog');
        messageLog.innerHTML += `<div data-source = "client">${messageContent}</div>`;
    } else {
        const messageLog = document.getElementById('messageLog');
        messageLog.innerHTML += `<div data-source = "admin">${messageContent}</div>`;
    }
});

socket.addEventListener('close', (event) => {
    console.log('WebSocket connection fermé', event);
});

socket.addEventListener('error', (event) => {
    console.error('WebSocket error', event);
});

// Fonction pour récupérer les messages sauvegardés dans le stockage local
function getSavedMessages() {
    return JSON.parse(localStorage.getItem('savedMessages')) || [];
}

// Fonction pour sauvegarder les messages dans le stockage local
function saveMessages(messages) {
    localStorage.setItem('savedMessages', JSON.stringify(messages));
}

//  Pour charger les messages sauvegardés et pour vérifier si l'e-mail du client est sauvegardé
window.addEventListener('load', () => {
    const savedMessages = getSavedMessages();
    const messageLog = document.getElementById('messageLog');
    messageLog.innerHTML = savedMessages.join(''); // Ajouter les messages sauvegardés au messageLog
    // Restaurer le nom du client s'il est sauvegardé
    userName = localStorage.getItem('userName');

    // Vérifier si l'adresse e-mail du client est déjà sauvegardée
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
        // Si une adresse e-mail est déjà sauvegardée, passer directement à l'étape suivante du chatbot
        chatbotState = ChatbotStates.AWAITING_ANSWER;
    } else {
        // Si aucune adresse e-mail n'est sauvegardée, demander au client de la saisir
        initialResponse();
    }
});

// États possibles du chatbot
const ChatbotStates = {
    INITIAL: 'INITIAL',
    AWAITING_EMAIL: 'AWAITING_EMAIL', 
    AWAITING_ANSWER: 'AWAITING_ANSWER',
    ADMIN_INTERACTION: 'ADMIN_INTERACTION'
};

// Variable pour suivre l'état actuel du chatbot
let chatbotState = ChatbotStates.INITIAL;

// Fonction pour gérer la réponse du chatbot en fonction de l'état actuel
function chatbotResponse(userMessage) {
    let response;
    switch (chatbotState) {
        case ChatbotStates.INITIAL:
            response = initialResponse(userMessage);
            break;
        case ChatbotStates.AWAITING_EMAIL:
            response = awaitingEmailResponse(userMessage);
            break;
        case ChatbotStates.AWAITING_ANSWER:
            response = awaitingAnswerResponse(userMessage);
            break;
        case ChatbotStates.ADMIN_INTERACTION:
            response = "Un administrateur prendra bientôt contact avec vous.";
            break;
        default:
            response = "Je suis désolé, je ne comprends pas. Pouvez-vous reformuler votre question ?";
            break;
    }
    return response;
}

// Fonction pour gérer la réponse initiale du chatbot
function initialResponse(userMessage) {
    chatbotState = ChatbotStates.AWAITING_EMAIL; // Mettre à jour l'état
    return "Veuillez saisir votre adresse email :";
}

//Fonction pour vérifier l'adresse e-mail
function isValidEmail(email) {
    // Expression régulière pour vérifier le format de l'adresse e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Fonction pour gérer la réponse lors de la saisie de l'adresse e-mail
function awaitingEmailResponse(userMessage) {
    const email = userMessage.trim(); // Supprimer les espaces blancs inutiles
    if (isValidEmail(email)) {
        // L'adresse email est valide, passer à l'étape suivante du chatbot
        chatbotState = ChatbotStates.AWAITING_ANSWER;
        // Sauvegarder l'adresse e-mail du client dans le stockage local
        localStorage.setItem('userEmail', email);
        return "Adresse email valide. <br><br>" +
            "Veuillez choisir une langue : <br>" +
            "<button id='malagasyButton' onclick='sendMessage(\"Malagasy\", this)'>Malagasy</button>" +
            "<button id='francaisButton' onclick='sendMessage(\"Français\", this)'>Français</button>";
    }
    else {
        // L'adresse email n'est pas valide, demander au client de saisir à nouveau
        return "Bonjour, veuillez saisir votre adresse e-mail";
    }
}

// Variable de contrôle pour suivre si une réponse a été envoyée
let responseSent = false; 

function awaitingAnswerResponse(userMessage) {
    // Convertir le message en minuscules pour une correspondance insensible à la casse
    const lowerCaseMessage = userMessage.toLowerCase();
    // Traitement des réponses du client en fonction de ce qu'il a choisi précédemment
    let response = '';
    // Réinitialisation de  la variable responseSent à false à chaque réponse du client
    responseSent = false;
    if (!responseSent) { // Vérifier si une réponse n'a pas déjà été envoyée
        if (lowerCaseMessage === "malagasy") {
            response = "Miarahaba anao tongasoa. Inona no azo hanampiana anao ?<br>" +
            "<button id='toeranaButton' onclick='sendMessage(\"Toerana\", this)'>Toerana misy anay?</button>" +
            "<button id='oraFisokafanaButton' onclick='sendMessage(\"Ora fisokafana\", this)'>Ora fisokafana</button>" ;
        } else if (lowerCaseMessage === "toerana") {
            response = "Hitanao ety Soanierana ny magazay misy anay.";
            document.getElementById('toeranaButton').disabled = true; // Désactiver le bouton
            responseSent = true; // Marquer que la réponse a été envoyée
        } else if (lowerCaseMessage === "ora fisokafana") {
            response = "Maraina: 07h45 hatramin'ny 12h - Hariva: 14h hatramin'ny 17h";
            document.getElementById('oraFisokafanaButton').disabled = true; // Désactiver le bouton
            responseSent = true; // Marquer que la réponse a été envoyée
        } else if (lowerCaseMessage === "français") {
            response = "Bonjour bienvenu. En quoi puis-je vous aider ?<br>"+
            "<button id='localisationButton' onclick='sendMessage(\"Localisation\", this)'>Notre localisation?</button>" +
            "<button id='heureButton' onclick='sendMessage(\"Heure\", this)'>Heure d'ouverture?</button>" ;
        } else if (lowerCaseMessage === "localisation") {
            response = "Nous nous situons à Soanierana";
            document.getElementById('localisationButton').disabled = true; // Désactiver le bouton
            responseSent = true; // Marquer que la réponse a été envoyée
        } else if (lowerCaseMessage === "heure") {
            response = "Matin: 07h45 - 12h - Après-midi: 14h - 17h";
            document.getElementById('heureButton').disabled = true; // Désactiver le bouton
            responseSent = true;
        }
    }
    return response;
}

// Fonction pour envoyer le message à l'admin
function sendMessage(message, button) {
    const userName = localStorage.getItem('userName');
    sendMessageToAdmin(message, userName);
    button.disabled = true; // Désactiver le bouton après avoir envoyé le message
}

// Fonction pour afficher également le message du client dans la zone de discussion
function sendMessageToAdmin(userMessage, name) {
    const data = {
        toAdmin: true,
        clientName: name,
        content: userMessage // Envoyer le message de l'utilisateur à l'administrateur
    };
    // Envoyer le message du client à l'admin
    socket.send(JSON.stringify(data));
    // Obtenir la réponse du chatbot en fonction du message de l'utilisateur
    const response = chatbotResponse(userMessage);
    // Afficher le message de l'utilisateur dans la zone de discussion
    const messageLog = document.getElementById('messageLog');
    messageLog.innerHTML += `<div data-source="admin">${userMessage}</div>`;
    // Mettre à jour le nom du client sur le titre h1
    document.getElementById('clientName').innerText = name;
    // Si une réponse du chatbot est disponible, l'ajouter au journal des messages
    if (response) {
        // Créer un objet de données pour la réponse du chatbot
        const responseData = {
            adminMessage: true,
            clientId: clientId,
            content: response // Envoyer la réponse du chatbot à l'administrateur
        };
        // Envoyer la réponse du chatbot au serveur
        socket.send(JSON.stringify(responseData));
    }
}

// Modifier la fonction pour envoyer un message pour sauvegarder les messages
document.getElementById('sendMessageButton').addEventListener('click', () => {
    const userMessage = document.getElementById('messageInput').value.trim();
    if (userMessage) {
        sendMessageToAdmin(userMessage, userName);
        document.getElementById('messageInput').value = '';
    }
});

// Envoyer une image avec l'ID du client
function sendImage() {
    const file = document.getElementById('imageInput').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const imageBase64 = event.target.result.split(',')[1];
            const message = {
                type: 'image',
                content: imageBase64,
                extension: file.name.split('.').pop(),
                filename: file.name,
                clientId: getClientId() // Ajouter l'ID du client
            };
            socket.send(JSON.stringify(message));
        };
        reader.readAsDataURL(file);
    }
}

// Récupère l'identifiant du client à partir du DOM.
function getClientId() {
    // Supposons que l'ID du client est stocké dans un élément HTML avec l'ID 'clientID'
    // Vous pouvez récupérer cette valeur à partir du DOM
    const clientIdElement = document.getElementById('clientID');
    if (clientIdElement) {
        return clientIdElement.textContent; // Renvoie le texte contenu dans l'élément
    } else {
        return ''; // Renvoie une chaîne vide si l'élément n'est pas trouvé
    }
}

// Événements pour le changement de fichier pour l'input d'image
document.getElementById('ImageInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        displayContent(file);
    }
});

// Affichage du contenu du fichier sélectionné dans l'input de message
function displayContent(file) {
    const messageInput = document.getElementById('messageInput');
    const reader = new FileReader();
    if (file.type.includes('image')) {
        reader.onload = function (e) {
            messageInput.value = `<img src="${e.target.result}" alt="Image sélectionnée">`;
        };
        reader.readAsDataURL(file);
    }
}

// Réinitialisation de l'input de message après l'envoi du message
function resetMessageInput() {
    const messageInput = document.getElementById('messageInput');
    messageInput.value = '';
}

// Définition d'une fonction pour envoyer le message à partir de l'entrée de message
function sendMessageFromInput() {
    const userMessage = messageInput.value.trim();
    if (userMessage) {
        sendMessageToAdmin(userMessage, userName);
        messageInput.value = '';
    }
}

const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessageButton');

// Ajoutez un écouteur d'événements pour le clic sur le bouton d'envoi de messages
sendMessageButton.addEventListener('click', () => {
    sendMessageFromInput();
});

// Ajoutez un écouteur d'événements pour la pression de la touche Entrée dans l'entrée de message
messageInput.addEventListener('keypress', (event) => {
    // Vérifiez si la touche pressée est la touche Entrée (keyCode 13)
    if (event.keyCode === 13) {
        sendMessageFromInput();
    }
});