// Générer un identifiant unique pour le client
const clientId = localStorage.getItem('clientId') || uuid.v4();
localStorage.setItem('clientId', clientId); // Stocker l'identifiant dans le stockage local

// Connecter au serveur WebSocket en envoyant l'identifiant unique
const socket = new WebSocket('ws://localhost:8084?clientId=' + clientId);

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
        // Si aucune adresse e-mail n'est sauvegardée, demander au client de choisir une langue
        initialResponse();
    }
});

// États possibles du chatbot
const ChatbotStates = {
    INITIAL: 'INITIAL',
    AWAITING_LANGUAGE: 'AWAITING_LANGUAGE',
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
        case ChatbotStates.AWAITING_LANGUAGE:
            response = awaitingLanguageResponse(userMessage);
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
    chatbotState = ChatbotStates.AWAITING_LANGUAGE; // Mettre à jour l'état
    return "Veuillez choisir une langue : <br>" +
        "<button id='malagasyButton' onclick='sendMessage(\"Malagasy\", this)'>Malagasy</button>" +
        "<button id='francaisButton' onclick='sendMessage(\"Français\", this)'>Français</button>";
}

// Fonction pour gérer la réponse lors du choix de la langue
function awaitingLanguageResponse(userMessage) {
    const lowerCaseMessage = userMessage.toLowerCase();
    if (lowerCaseMessage === "malagasy" || lowerCaseMessage === "français") {
        // Si l'utilisateur a choisi une langue, passer à l'étape de saisie de l'adresse e-mail
        chatbotState = ChatbotStates.AWAITING_EMAIL;
        return "Veuillez choisir :" +
            "<button id='niveau1' onclick='sendMessage(\"Professionnel\", this)'>Professionnel</button>" +
            "<button id='niveau1' onclick='sendMessage(\"Particulier\", this)'>Particulier</button>";
    } else {
        // Si l'utilisateur n'a pas choisi une langue valide, demander à nouveau
        return "Veuillez choisir une language: <br>" +
            "<button id='malagasyButton' onclick='sendMessage(\"Malagasy\", this)'>Malagasy</button>" +
            "<button id='francaisButton' onclick='sendMessage(\"Français\", this)'>Français</button>";
    }
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
            "Veuillez choisir une option : <br>" +
            "<button id='niveau1' onclick='sendMessage(\"Je cherche un produit\", this)'>Je cherche un produit</button>" +
            "<button id='niveau1' onclick='sendMessage(\"Demander des renseignements\", this)'>Demander des renseignements</button>" +
            "<button id='niveau1' onclick='sendMessage(\"Demander un devis\", this)'>Demander un devis</button>" +
            "<button id='niveau1' onclick='sendMessage(\"Détails sur un produit\", this)'>Détails sur un produit</button>" +
            "<button id='niveau1' onclick='sendMessage(\"Service après vente\", this)'>Service après vente</button>" +
            "<button id='niveau1' onclick='sendMessage(\"Autres\", this)'>Autres</button>" ;
    }
    else {
        // L'adresse email n'est pas valide, demander au client de saisir à nouveau
        return "Veuillez saisir une adresse e-mail ou numéro de téléphone";
    }
}

// Variable de contrôle pour suivre si une réponse a été envoyée
let responseSent = false; 
let awaitingLinkOrPhoto = false;
let awaitingDevis = false;
let awaitingPayement = false;
let lieuLivraison = false;
let autreInfo = false;
let awaitingYesNoResponse = false;
let detailsProd = false;
let detailYesNo = false;

// Variable pour stocker le message
const requestLinkOrPhotoMessage = "Veuillez envoyer le lien ou la photo du produit";

function awaitingAnswerResponse(userMessage) {
    // Convertir le message en minuscules pour une correspondance insensible à la casse
    const lowerCaseMessage = userMessage.toLowerCase();
    // Traitement des réponses du client en fonction de ce qu'il a choisi précédemment
    let response = '';
    // Réinitialisation de  la variable responseSent à false à chaque réponse du client
    responseSent = false;
    if (!responseSent) { // Vérifier si une réponse n'a pas déjà été envoyée
         // Si le chatbot attend un lien ou une photo pour un devis
         if (awaitingDevis) {
            response = "En combien de quantité ?";
            awaitingDevis = false; // Réinitialiser le statut
            responseSent = true; // Marquer que la réponse a été envoyée
        } else if (awaitingLinkOrPhoto) {
            response = "Patientez un moment, je vérifie le stock";
            awaitingLinkOrPhoto = false; // Réinitialiser le statut
            responseSent = true; // Marquer que la réponse a été envoyée
        } else if (awaitingPayement) {
            response  = "Quel est votre mode de paiement? <br><br>" + 
                "<button id='niveau1' onclick='sendMessage(\"Espèce\", this)'>Espèce</button>" +
                "<button id='niveau1' onclick='sendMessage(\"Chèque\", this)'>Chèque</button>" +
                "<button id='niveau1' onclick='sendMessage(\"Virement\", this)'>Virement</button>" +
                "<button id='niveau1' onclick='sendMessage(\"Autre\", this)'>Autre</button>" ;
            awaitingPayement = false;
            responseSent = true;
        } else if (lieuLivraison){
            response = "Veuillez indiquer votre nom, ainsi que la date et le lieu de livraison souhaités";
            lieuLivraison = false;
            responseSent = true;
        } else if (autreInfo) {
            response = "Souhaitez-vous rajouter d’autres informations ? <br><br>" + 
                "<button id='niveau1' onclick='sendMessage(\"Oui\", this)'>Oui</button>" +
                "<button id='niveau1' onclick='sendMessage(\"Non\", this)'>Non</button>" ;
            autreInfo = false;
            responseSent = true;
        } else if(awaitingYesNoResponse) {
            if (lowerCaseMessage === "oui") {
                response = "En quoi d’autre puis-je vous aider ?";
            } else if (lowerCaseMessage === "non") {
                response = "Notre service commercial vous enverra un devis par e-mail sous peu. Merci de nous avoir contacté. A bientôt !";
            }
            awaitingYesNoResponse = false;
            responseSent = true;
        } else if(detailsProd) {
            response = "Avez-vous eu la fiche technique correspondante ? <br><br>"+ 
            "<button id='niveau1' onclick='sendMessage(\"Oui\", this)'>Oui</button>" +
            "<button id='niveau1' onclick='sendMessage(\"Non\", this)'>Non</button>" ;
            detailsProd = false;
            responseSent = true;
        } else if (detailYesNo) {
            if (lowerCaseMessage === "oui") {
                responseSent = true;
            } else if (lowerCaseMessage === "non") {
                response = "Quelle informations voudriez-vous avoir ?";
            }
            detailYesNo = false;
            responseSent = true;
        }

        //1
        else if (lowerCaseMessage === "je cherche un produit") {
                response = "Quels produits?<br>" +
                "<button id='outillageBouton' onclick='sendMessage(\"Outillage\", this)'>Outillage</button>" +
                "<button id='métallurgieBouton' onclick='sendMessage(\"Métallurgie\", this)'>Métallurgie</button>" +
                "<button id='peintureBouton' onclick='sendMessage(\"Peinture & étanchéité\", this)'>Peinture & étanchéité</button>" +
                "<button id='sécuritéBouton' onclick='sendMessage(\"Sécurité incendie\", this)'>Sécurité incendie</button>" +
                "<button id='travauxBouton' onclick='sendMessage(\"Travaux publics & génie civil\", this)'>Travaux publics & génie civil</button>" +
                "<button id='équipementBouton' onclick='sendMessage(\"Équipement électrique & soudage\", this)'>Équipement électrique & soudage </button>" ;
            } else if (lowerCaseMessage === "outillage") {
                response = requestLinkOrPhotoMessage;
                document.getElementById('outillageBouton').disabled = true; // Désactiver le bouton
                awaitingLinkOrPhoto = true;
                responseSent = true; // Marquer que la réponse a été envoyée
            } else if (lowerCaseMessage === "métallurgie") {
                response = requestLinkOrPhotoMessage;
                document.getElementById('métallurgieBouton').disabled = true; // Désactiver le bouton
                awaitingLinkOrPhoto = true;
                responseSent = true; // Marquer que la réponse a été envoyée
            } else if (lowerCaseMessage === "peinture & étanchéité") {
                response = requestLinkOrPhotoMessage;
                document.getElementById('peintureBouton').disabled = true; // Désactiver le bouton
                awaitingLinkOrPhoto = true;
                responseSent = true; // Marquer que la réponse a été envoyée
            }
            else if (lowerCaseMessage === "sécurité incendie") {
                response = requestLinkOrPhotoMessage;
                document.getElementById('sécuritéBouton').disabled = true; // Désactiver le bouton
                awaitingLinkOrPhoto = true;
                responseSent = true; // Marquer que la réponse a été envoyée
            }
            else if (lowerCaseMessage === "travaux publics & génie civil") {
                response = requestLinkOrPhotoMessage;
                document.getElementById('travauxBouton').disabled = true; // Désactiver le bouton
                awaitingLinkOrPhoto = true;
                responseSent = true; // Marquer que la réponse a été envoyée
            }
            else if (lowerCaseMessage === "équipement électrique & soudage") {
                response = requestLinkOrPhotoMessage;
                document.getElementById('équipementBouton').disabled = true; // Désactiver le bouton
                awaitingLinkOrPhoto = true;
                responseSent = true; // Marquer que la réponse a été envoyée
            }
            
            //2 
            else if (lowerCaseMessage === "demander des renseignements") {
                response = "Quels renseignements?<br>"+
                "<button id='savBouton' onclick='sendMessage(\"SAV\", this)'>SAV</button>" +
                "<button id='partenariatBouton' onclick='sendMessage(\"Partenariat\", this)'>Partenariat</button>" +
                "<button id='fournisseursBouton' onclick='sendMessage(\"Fournisseurs\", this)'>Fournisseurs</button>" +
                "<button id='recrutementBouton' onclick='sendMessage(\"Recrutement\", this)'>Recrutement</button>" +
                "<button id='contacterBouton' onclick='sendMessage(\"Contacter magasins\", this)'>Contacter magasins</button>" +
                "<button id='autresBouton' onclick='sendMessage(\"Autres\", this)'>Autres </button>" ;
            } else if (lowerCaseMessage === "sav") {
                response = requestLinkOrPhotoMessage;
                document.getElementById('savBouton').disabled = true; // Désactiver le bouton
                awaitingLinkOrPhoto = true;
                responseSent = true; // Marquer que la réponse a été envoyée
            }  else if (lowerCaseMessage === "partenariat") {
                response = requestLinkOrPhotoMessage;
                document.getElementById('partenariatBouton').disabled = true; // Désactiver le bouton
                awaitingLinkOrPhoto = true;
                responseSent = true; // Marquer que la réponse a été envoyée
            } else if (lowerCaseMessage === "fournisseurs") {
                response = requestLinkOrPhotoMessage;
                document.getElementById('fournisseursBouton').disabled = true; // Désactiver le bouton
                awaitingLinkOrPhoto = true;
                responseSent = true; // Marquer que la réponse a été envoyée
            } else if (lowerCaseMessage === "recrutement") {
                response = requestLinkOrPhotoMessage;
                document.getElementById('recrutementBouton').disabled = true; // Désactiver le bouton
                awaitingLinkOrPhoto = true;
                responseSent = true; // Marquer que la réponse a été envoyée
            } else if (lowerCaseMessage === "contacter magasins") {
                response = requestLinkOrPhotoMessage;
                document.getElementById('contacterBouton').disabled = true; // Désactiver le bouton
                awaitingLinkOrPhoto = true;
                responseSent = true; // Marquer que la réponse a été envoyée
            } else if (lowerCaseMessage === "autres") {
                response = requestLinkOrPhotoMessage;
                document.getElementById('autresBouton').disabled = true; // Désactiver le bouton
                awaitingLinkOrPhoto = true;
                responseSent = true; // Marquer que la réponse a été envoyée
            }
            
            //3
            else if (lowerCaseMessage === "demander un devis") {
                response = requestLinkOrPhotoMessage;
                awaitingDevis = true;
                awaitingPayement = true;
                responseSent = true; // Marquer que la réponse a été envoyée
                lieuLivraison = true;
                autreInfo = true;
                awaitingYesNoResponse = true;
            }

            //4
            if (lowerCaseMessage === "détails sur un produit") {
                response = requestLinkOrPhotoMessage;
                detailsProd = true;
                detailYesNo= true;
                responseSent = true; // Marquer que la réponse a été envoyée
            }

            //5 Service après vente
            if (lowerCaseMessage === "service après vente") {
                response = "" +
                    "<button id='savBouton' onclick='sendMessage(\"Réclamation\", this)'>Réclamation</button>" +
                    "<button id='partenariatBouton' onclick='sendMessage(\"Réparer un produit\", this)'>Réparer un produit</button>" +
                    "<button id='fournisseursBouton' onclick='sendMessage(\"Chercher des pièces détachées\", this)'>Chercher des pièces détachées</button>" +
                    "<button id='recrutementBouton' onclick='sendMessage(\"Garantie\", this)'>Garantie</button>" +
                    "<button id='contacterBouton' onclick='sendMessage(\"Récupérer un produit\", this)'>Récupérer un produit</button>" +
                    "<button id='autresBouton' onclick='sendMessage(\"Autre\", this)'>Autre</button>" ;
                responseSent = true; // Marquer que la réponse a été envoyée
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