/* TO-DO
1. CHANGE IMPORT BUTTON TO ACTUALLY IMPORT. GREEN HIGHLIGHT WHEN HOVERED OVER
2. ADD A REMOVE MODE TOGGLE AT THE TOP CENTER OF THE PAGE WHICH TOGGLES THE BUTTON BETWEEN REMOVE AND IMPORT
3. ADD A CLEAR ALL BUTTON, THE UNDO AND REDO BUTTONS
4. CHANGE INPUT BOX ACTIVE HIGHLIGHT TO PINK
5. FIGURE OUT HOW TO MAKE THE WEBSITE ZOOM IN ON PHONE, AND MAKE PRESSING RETURN WORK
*/

class ClothingType {
    static types = {
        HAIR: "发型",
        DRESS: "连衣裙",
        COAT: "外套",
        TOP: "上装",
        BOTTOM: "下装",
        SOCKS: "袜子",
        SHOES: "鞋子",
        ACCESSORIES: "饰品",
        MAKEUP: "妆容",
        SPIRIT: "萤光之灵"
    };
}

class Category {
    constructor(type) {
        this.type = type;
        this.items = new Set();
    }

    addItems(itemsList) {
        itemsList.forEach(item => this.items.add(item));
    }

    removeItems(itemsList) {
        itemsList.forEach(item => this.items.delete(item));
    }

    getItemCount() {
        return this.items.size;
    }

    toString() {
        return this.items.size ? [...this.items].sort((a, b) => a - b).join(", ") : "No items";
    }

    isEmpty() {
        return this.items.size === 0;
    }
}



class Wardrobe {
    // Loops through ClothingTypes in their natural order, and initializes a new Category for each ClothingType
    constructor() {
        this.wardrobe = new Map();
        for (const key in ClothingType.types) {
            this.wardrobe.set(ClothingType.types[key], new Category(ClothingType.types[key]));
        }

        this.loadWardrobe(); // Restore wardrobe from sessionStorage
    }

    // Returns the Category given a type
    getCategory(type) {
        return this.wardrobe.get(type);
    }

    // Handles adding clothing items entered into the input box
    addClothingItems(type, itemsString) {
        if (!itemsString.trim()) return;
    
        // Remove ALL leading "!" characters
        let isRemoval = itemsString.startsWith("!");
        let cleanedInput = isRemoval ? itemsString.replace(/^!+/, "").trim() : itemsString;
        let items = this.parseItems(cleanedInput);
    
        if (isRemoval) {
            this.wardrobe.get(type).removeItems(items);
        } else {
            this.wardrobe.get(type).addItems(items);
        }
    
        this.saveWardrobe();
        this.render();
    }
    
    saveWardrobe() {
        let wardrobeData = {};

        this.wardrobe.forEach((category, type) => {
            wardrobeData[type] = [...category.items]; // Convert set to Array
        });

        sessionStorage.setItem("wardrobeData", JSON.stringify(wardrobeData));
    }

    loadWardrobe() {
        let savedData = sessionStorage.getItem("wardrobeData");
        if (!savedData) return; // If no saved wardrobe, do nothing

        let wardrobeData = JSON.parse(savedData);
        Object.keys(wardrobeData).forEach(type => {
            let category = this.getCategory(type);
            if (category){
                category.addItems(wardrobeData[type]);
            }
        });

        this.render();
    }

    // Parses through a string of clothing items, accepting the x+n format
    parseItems(itemsString) {
        let list = [];
        let tokens = itemsString.split(",");

        tokens.forEach(token => {
            token = token.trim();
            if (token.includes("+")) {
                let parts = token.split("+");
                if (parts.length === 2) {
                    let start = parseInt(parts[0], 10);
                    let incrementCount = parseInt(parts[1], 10);
                    for (let i = 0; i <= incrementCount; i++) {
                        list.push(start + i);
                    }
                }
            } else {
                let num = parseInt(token, 10);
                if (!isNaN(num)) {
                    list.push(num);
                }
            }
        });

        return list;
    }

    // Returns the formatted items in the x+n format
    formatItems(items) {
        if (items.length === 0) return "";
        items.sort((a, b) => a - b);

        let result = [];
        let start = items[0], count = 0;

        for (let i = 1; i <= items.length; i++) {
            if (items[i] === items[i - 1] + 1) {
                count++;
            } else {
                result.push(count > 0 ? `${start}+${count}` : `${start}`);
                start = items[i];
                count = 0;
            }
        }
        return result.join(",");
    }

    copyWardrobeToClipboard() {
        const text = document.getElementById("wardrobe-summary").textContent;
        navigator.clipboard.writeText(text).then(() => {
            alert("Copied to clipboard!");
        });
    }

    // Opens the file selector to import a wardrobe file
    importWardrobe() {
        const fileInput = document.getElementById("fileInput");
        if (fileInput) {
            fileInput.click(); // Opens the file selector
        } else {
            console.error("File input element not found!");
        }
    }
    
    // Handles reading the imported wardrobe file
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            this.loadWardrobeFromString(content);
        };
        reader.readAsText(file);
    }

    // Updates the summary in the WardrobeBox 
    updateWardrobeSummary() {
        let summaryParts = []; // Use an array to efficiently build the string
    
        this.wardrobe.forEach((category, type) => {
            let formatted = this.formatItems([...category.items]);
            if (formatted) {
                summaryParts.push(`${type}:${formatted}`); // Ensure correct format
            }
        });
    
        // Only add "|" delimiter if there are actual items
        let summary = summaryParts.length > 0 ? summaryParts.join("|") + "|" : "";
    
        document.getElementById("wardrobe-summary").textContent = summary;
    }
    
    // Handles pressing the expand button to expand the WardrobeBox
    toggleExpandSummary() {
        let wardrobeBox = document.getElementById("wardrobe-box");
        let expandButton = document.querySelector(".expand-icon"); 
    
        if (!wardrobeBox.classList.contains("expanded")) {
            wardrobeBox.classList.add("expanded");
    
            // Change the Expand icon to Collapse
            expandButton.classList.remove("fa-expand");
            expandButton.classList.add("fa-compress"); 

            // Scroll to the wardrobe box
            setTimeout(() => {
                wardrobeBox.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 300); // Add a slight delay to ensure the expand animation finishes
        } else {
            wardrobeBox.classList.remove("expanded");
    
            // Change the icon back to Expand
            expandButton.classList.remove("fa-compress");
            expandButton.classList.add("fa-expand");
        }
    }
    
    // Parses the string from the imported wardrobe file
    loadWardrobeFromString(data) {
        // Clear existing wardrobe before loading new data
        this.wardrobe.forEach(category => category.items.clear());
    
        const sections = data.split("|").map(section => section.trim()).filter(Boolean);
    
        sections.forEach(section => {
            let plusIndex = section.indexOf(":");
            if (plusIndex !== -1) {
                let typeName = section.substring(0, plusIndex).trim(); // Get category name
                let itemsPart = section.substring(plusIndex + 1).trim(); // Get items
                let itemsList = this.parseItems(itemsPart);
    
                // Directly match category names from ClothingType.types
                let categoryType = Object.values(ClothingType.types).find(value => value === typeName);
    
                if (categoryType) {
                    this.getCategory(categoryType).addItems(itemsList);
                }
            }
        });

        this.saveWardrobe(); // Save after loading new wardrobe    
        this.render();
    }
    
    // Write the current wardrobe to a .txt file
    exportWardrobe() {
        // Prompt the user for a file name
        let fileName = prompt("Enter the file name", "wardrobe");
    
        // Ensure the file name is valid and ends with .txt
        if (!fileName) {
            alert("Export canceled.");
            return;
        }
        if (!fileName.endsWith(".txt")) {
            fileName += ".txt"; // Automatically add .txt if not present
        }
    
        // Get wardrobe content
        const data = document.getElementById("wardrobe-summary").textContent;
    
        // Create a Blob and download the file
        const blob = new Blob([data], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Retrieves the WardrobeBox contents as a string
    toString() {
        return document.getElementById("wardrobe-summary").textContent;
    }
    
    copyTextToClipboard(text, copyFeedback) {
        if (!text) return;
    
        navigator.clipboard.writeText(text).then(() => {
            copyFeedback.style.display = "inline";
    
            setTimeout(() => {
                copyFeedback.style.display = "none";
            }, 1000);
        });
    }
    
    // Returns the total number of items in the wardrobe
    getTotalItemCount() {
        let total = 0;
        this.wardrobe.forEach(category => {
            total += category.getItemCount();
        });
        return total;
    }

    render() {
        const container = document.getElementById("wardrobe-container");
        container.innerHTML = ""; // Clear the container

        // Store the ID of the currently focused input field
        let lastFocusedInputId = document.activeElement ? document.activeElement.id : null;

        const removeToggle = document.querySelector(".toggle-switch input");
        let isRemove = removeToggle.checked;

        // Configures each Category Box
        this.wardrobe.forEach((category, type) => {
            const template = document.querySelector(".category-box");
            
            // Each Category Box follows the same template format
            const categoryBox = template.cloneNode(true);
            categoryBox.style.display = "block";
        
            // Get the header elements
            const copyFeedback = categoryBox.querySelector(".copy-feedback");
            const title = categoryBox.querySelector(".category-title");
            const itemCount = categoryBox.querySelector(".item-count");
            
            // Updates the item count of each category
            if (title) title.textContent = type;
            if (itemCount) {
                const count = category.getItemCount();
                itemCount.textContent = count > 0 ? count : "";
            }
            
            // Make the category title clickable to copy text
            if (title) {
                title.onclick = () => {
                    const categoryObj = this.getCategory(type);
                    if (categoryObj) {
                        const formattedItems = this.formatItems([...categoryObj.items]);
                        if (formattedItems) {
                            this.copyTextToClipboard(formattedItems, copyFeedback);
                        }
                    }
                };
            }
            
            // Make items clickable to copy text
            const itemsDiv = categoryBox.querySelector(".items");
            if (itemsDiv) {
                itemsDiv.textContent = this.formatItems([...category.items]); // Keeps formatting as displayed
                itemsDiv.style.cursor = "pointer";

                itemsDiv.onclick = () => {
                    this.copyTextToClipboard(itemsDiv.textContent.trim(), copyFeedback); // Uses displayed text
                };
            }
            container.appendChild(categoryBox);

            // Configure the input box and allows pressing Enter to import
            const input = categoryBox.querySelector("input");
            const importButton = categoryBox.querySelector("button");

            if (importButton) {
                importButton.textContent = isRemove ? "Remove" : "Import";
                importButton.style.color = isRemove ? "#b5485d" : "";
                importButton.style.borderColor = isRemove ? "#b5485d" : "#9d8189";
            
                importButton.onclick = () => {
                    let inputId = input.id;

                    isRemove = removeToggle.checked;
                    
                    if (isRemove) {
                        this.addClothingItems(type, "!" + input.value);
                    } else {
                        this.addClothingItems(type, input.value);
                    }

                    setTimeout(() => {
                        let inputElement = document.getElementById(inputId);
                        if (inputElement) inputElement.focus();
                    }, 0);
                };
            }
            
            document.addEventListener("DOMContentLoaded", function () {
                // Select the toggle input
                const removeToggle = document.querySelector(".toggle-switch input");
        
                // Add event listener for change
                removeToggle.addEventListener("change", function () {
                    isRemove = this.checked; // Check if toggle is on
                    
                    document.querySelectorAll(".category-box button").forEach(button => {
                        button.textContent = isRemove ? "Remove" : "Import";
                        button.style.color = isRemove ? "#b5485d" : "";
                        button.style.borderColor = isRemove ? "#b5485d" : "#9d8189";
                    });
                });
            });

            if (input) {
                input.id = `input-${type}`; // Assign unique ID per category
                
                // Handle Enter key submission
                input.addEventListener("keydown", (event) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        
                        isRemove = removeToggle.checked;

                        if (isRemove) {
                            this.addClothingItems(type, "!" + input.value); // Remove items
                        } else {
                            this.addClothingItems(type, input.value); // Add items
                        }

                        let inputId = input.id; // Store input field ID
                        input.value = ""; // Clear input field
    
                        // Restore focus after UI updates
                        setTimeout(() => { document.getElementById(inputId).focus(); }, 0);
                    }
                });
            }
        });

        // Enable clicking on the wardrobe box to copy full wardrobe
        const wardrobeBox = document.getElementById("wardrobe-summary");
        const wardrobeCopyFeedback = document.getElementById("wardrobe-copy-feedback");
        const wardrobeTitle = document.querySelector(".wardrobe-header .category-title");

        if (wardrobeBox) {
            wardrobeBox.style.cursor = "pointer";
            wardrobeBox.onclick = () => {
                this.copyTextToClipboard(wardrobeBox.textContent.trim(), wardrobeCopyFeedback);
            };
        }

        // Enable clicking the wardrobe title to copy wardrobe items
        if (wardrobeTitle) {
            wardrobeTitle.style.cursor = "pointer";
            wardrobeTitle.onclick = () => {
                this.copyTextToClipboard(wardrobeBox.textContent.trim(), wardrobeCopyFeedback);
            };
        }

        // Ensure clipboard icon in wardrobe box copies the same text
        const wardrobeClipboardIcon = document.querySelector(".wardrobe-box .copy-icon");
        if (wardrobeClipboardIcon) {
            wardrobeClipboardIcon.onclick = () => {
                this.copyTextToClipboard(wardrobeBox.textContent.trim(), wardrobeCopyFeedback);
            };
        }

        // Restore focus to the last active input field after re-render
        if (lastFocusedInputId) {
            setTimeout(() => {
                let inputField = document.getElementById(lastFocusedInputId);
                if (inputField) {
                    inputField.focus();
                }
            }, 0);
        }        
        
        // Update the wardrobe summary
        this.updateWardrobeSummary();

        // Update the total wardrobe count at the top
        document.getElementById("total-count").textContent = `${this.getTotalItemCount()} Items`;

    }

}

function openInfoDialog() {
    document.getElementById("info-modal").style.display = "block";
}

function closeInfoDialog() {
    document.getElementById("info-modal").style.display = "none";
}

// Close modal if clicking outside of it
window.onclick = function(event) {
    let modal = document.getElementById("info-modal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
};


// Initialize and Render Wardrobe
const myWardrobe = new Wardrobe();
myWardrobe.render();
