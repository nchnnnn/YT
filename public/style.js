function windowScroll(){
    const section = $("#section");
    section.style.display = 'flex';
    const targetElement = document.querySelector(".target");
    targetElement.scrollIntoView();
    window.addEventListener("scroll", () => {
        const navbar = document.getElementById("navbar");
        const scrollPosition = window.scrollY;
        if (scrollPosition > 0) {
            navbar.classList.add("show");
        } else {
            navbar.classList.remove("show");
        }
    });
}
        
function windowReset(){
    section.style.display = 'none';
    targetElement.scrollIntoView();
}

function showErrorMessage(inputId, message) {
    const errorSpan = document.getElementById(`${inputId}-error`);
    if (errorSpan) {
        errorSpan.textContent = `${message}`;
        errorSpan.style.display = 'inline';
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            inputElement.classList.add('error');
        }
    }
}

function clearErrorMessage(inputId) {
    const errorSpan = document.getElementById(`${inputId}-error`);
    if (errorSpan) {
        errorSpan.style.display = 'none';
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            inputElement.classList.remove('error');
        }
    }
}


