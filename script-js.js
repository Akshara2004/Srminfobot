// DOM Element Selections
const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

// Variables
let userMessage = null;
let isResponseGenerating = false;

// API Configuration
const API_KEY = "AIzaSyDk2_-NWyp05dHN2SbkrYzkfkha6bTbivk";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

// Keywords and Patterns
const srmKeywords = [
    // Academic
    'srm', 'university', 'college', 'campus', 'department', 'faculty',
    'course', 'program', 'semester', 'academic', 'study', 'research',
    'lecture', 'class', 'laboratory', 'lab', 'library', 'examination',
    'exam', 'test', 'assignment', 'project', 'grade', 'result',
    'attendance', 'syllabus', 'curriculum', 'timetable', 'schedule',
    
    // Admissions & Fees
    'admission', 'application', 'enrollment', 'registration', 'fee',
    'scholarship', 'financial aid', 'document', 'certificate',
    'eligibility', 'criteria', 'requirement', 'deadline', 'payment',
    
    // Campus Life
    'hostel', 'accommodation', 'dormitory', 'cafeteria', 'canteen',
    'mess', 'food', 'transport', 'bus', 'shuttle', 'parking',
    'security', 'facility', 'amenity', 'infrastructure', 'wifi',
    'internet', 'lab', 'equipment', 'sports', 'gym', 'fitness',
    
    // Student Services
    'student', 'staff', 'faculty', 'teacher', 'professor', 'dean',
    'advisor', 'counselor', 'mentor', 'support', 'help', 'guidance',
    'office', 'department', 'administration', 'management',
    
    // Career & Placement
    'placement', 'career', 'internship', 'job', 'recruitment',
    'company', 'industry', 'corporate', 'salary', 'package',
    'interview', 'training', 'skill', 'development'
];

const conversationPatterns = {
    greetings: ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
    farewells: ['bye', 'goodbye', 'see you', 'thank you', 'thanks'],
    help: ['help', 'assist', 'support', 'guide', 'what can you do', 'how can you help']
};

// Function Declarations
const showWelcomeNotification = () => {
    const notification = document.createElement('div');
    notification.className = 'notification-popup';
    notification.innerHTML = `
        <div class="bot-icon">
            <span class="material-symbols-rounded">smart_toy</span>
        </div>
        <div class="notification-content">
            <div class="notification-title">SRM InfoBot</div>
            <div class="notification-message">👋 Hi! I'm here to help you with any questions about SRM University.</div>
        </div>
        <div class="close-btn">
            <span class="material-symbols-rounded">close</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 1000);

    notification.querySelector('.close-btn').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    });

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);
};

const loadLocalstorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = localStorage.getItem("themeColor") === "light_mode";
    
    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
    
    if (savedChats) {
        chatList.innerHTML = savedChats;
        document.body.classList.add("hide-header");
        chatList.scrollTo(0, chatList.scrollHeight);
    }
};

const createMessageElement = (content, isOutgoing = false) => {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", isOutgoing ? "outgoing" : "incoming");
    messageDiv.innerHTML = content;
    return messageDiv;
};

const processQuery = (query) => {
    query = query.toLowerCase().trim();
    
    if (conversationPatterns.greetings.some(greeting => query.includes(greeting))) {
        return `Hello! 👋 I'm SRM InfoBot, your university assistant. How can I help you today? Feel free to ask about:
- Admissions and programs
- Campus facilities
- Academic information
- Student services
- Placements and careers`;
    }
    
    if (conversationPatterns.farewells.some(farewell => query.includes(farewell))) {
        return "Thank you for chatting with me! If you have more questions, feel free to ask anytime. Have a great day! 😊";
    }
    
    if (conversationPatterns.help.some(helpWord => query.includes(helpWord))) {
        return `I can assist you with various aspects of SRM University:
1. Academic Information: Courses, programs, departments, faculty
2. Admission Process: Requirements, applications, documents
3. Campus Facilities: Hostels, transport, labs, library
4. Student Services: Support, guidance, mentoring
5. Career Services: Placements, internships, training

What would you like to know more about?`;
    }
    
    return null;
};

const showTypingEffect = (text, element, messageDiv) => {
    const words = text.split(' ');
    let currentIndex = 0;
    element.innerText = '';
    
    const typingInterval = setInterval(() => {
        if (currentIndex < words.length) {
            element.innerText += (currentIndex === 0 ? '' : ' ') + words[currentIndex];
            currentIndex++;
            chatList.scrollTo(0, chatList.scrollHeight);
        } else {
            clearInterval(typingInterval);
            isResponseGenerating = false;
            messageDiv.classList.remove("loading");
            
            if (messageDiv.classList.contains("incoming")) {
                const copyButton = messageDiv.querySelector(".icon");
                if (copyButton) copyButton.classList.remove("hide");
            }
            
            localStorage.setItem("savedChats", chatList.innerHTML);
        }
    }, 50);
};

const isUniversityRelatedQuery = (query) => {
    query = query.toLowerCase();
    return srmKeywords.some(keyword => query.includes(keyword.toLowerCase()));
};

const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");
    
    const processedResponse = processQuery(userMessage);
    if (processedResponse) {
        showTypingEffect(processedResponse, textElement, incomingMessageDiv);
        return;
    }

    if (!isUniversityRelatedQuery(userMessage)) {
        const response = "I'm specifically designed to help with SRM University-related queries. Please ask me about admissions, courses, campus facilities, or other university-related topics.";
        showTypingEffect(response, textElement, incomingMessageDiv);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ 
                        text: `As an SRM University assistant, provide detailed information about: ${userMessage}. 
                              Include specific details where possible and suggest relevant resources or contacts.
                              Keep the response focused on official university information.`
                    }]
                }]
            })
        });

        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        const apiResponse = data.candidates[0].content.parts[0].text.trim();
        showTypingEffect(apiResponse, textElement, incomingMessageDiv);
    } catch (error) {
        const errorMessage = "I apologize, but I'm having trouble connecting to my knowledge base. Please try again in a moment.";
        showTypingEffect(errorMessage, textElement, incomingMessageDiv);
        textElement.classList.add("error");
    }
};

const showLoadingAnimation = () => {
    const html = `
        <div class="message-content">
            <img src="images/gemini.svg" alt="Bot Avatar" class="avatar">
            <p class="text"></p>
            <div class="loading-indicator">
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
            </div>
        </div>
        <span class="icon material-symbols-rounded hide" onclick="copyMessage(this)">content_copy</span>
    `;
    
    const incomingMessageDiv = createMessageElement(html, false);
    incomingMessageDiv.classList.add("loading");
    chatList.appendChild(incomingMessageDiv);
    chatList.scrollTo(0, chatList.scrollHeight);
    generateAPIResponse(incomingMessageDiv);
};

const copyMessage = (copyBtn) => {
    const messageText = copyBtn.parentElement.querySelector(".text").textContent;
    navigator.clipboard.writeText(messageText);
    copyBtn.textContent = "done";
    setTimeout(() => copyBtn.textContent = "content_copy", 1500);
};

const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if (!userMessage || isResponseGenerating) return;

    isResponseGenerating = true;
    
    const html = `
        <div class="message-content">
            <img src="images/user.jpg" alt="User Avatar" class="avatar">
            <p class="text">${userMessage}</p>
        </div>
    `;
    
    const outgoingMessageDiv = createMessageElement(html, true);
    chatList.appendChild(outgoingMessageDiv);
    typingForm.reset();
    
    document.body.classList.add("hide-header");
    chatList.scrollTo(0, chatList.scrollHeight);
    setTimeout(showLoadingAnimation, 500);
};

// Event Listeners
const initializeEventListeners = () => {
    suggestions.forEach(suggestion => {
        suggestion.addEventListener("click", () => {
            userMessage = suggestion.querySelector(".text").textContent;
            handleOutgoingChat();
        });
    });

    toggleThemeButton.addEventListener("click", () => {
        const isLightMode = document.body.classList.toggle("light_mode");
        localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
        toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
    });

    deleteChatButton.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete all messages?")) {
            localStorage.removeItem("savedChats");
            chatList.innerHTML = "";
            document.body.classList.remove("hide-header");
        }
    });

    typingForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleOutgoingChat();
    });
};
// Add this to your existing script.js file

// Replace the existing suggestions-related JavaScript with this updated version

document.addEventListener('DOMContentLoaded', () => {
    const suggestionsGroup1 = document.getElementById('suggestions-group-1');
    const suggestionsGroup2 = document.getElementById('suggestions-group-2');
    const toggleButton = document.getElementById('toggleSuggestions');
    let isFirstGroup = true;

    toggleButton.addEventListener('click', () => {
        if (isFirstGroup) {
            // Hide first group
            suggestionsGroup1.classList.add('slide-up');
            // Show second group
            
                suggestionsGroup2.classList.add('slide-down');
            
        } else {
            // Hide second group
            suggestionsGroup2.classList.remove('slide-down');
            // Show first group
            
                suggestionsGroup1.classList.remove('slide-up');
            
        }

        // Toggle button rotation
        toggleButton.classList.toggle('rotated');
        isFirstGroup = !isFirstGroup;
    });

    // Add click handlers for new suggestions
    const allSuggestions = document.querySelectorAll('.suggestion');
    allSuggestions.forEach(suggestion => {
        suggestion.addEventListener("click", () => {
            userMessage = suggestion.querySelector(".text").textContent;
            handleOutgoingChat();
        });
    });
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadLocalstorageData();
    initializeEventListeners();
    showWelcomeNotification();
});

// Make copyMessage function global
window.copyMessage = copyMessage;