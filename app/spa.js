// Utilities for turning any html into a Single Page Application (SPA).
// Public API identifiers (i.e. names of exposed vars, consts and funcs) are prefixed with 'spa'.
// Blocks scopes are to hide the private elements.

const spaHomePageID = document.querySelector(".spa-page").id; // Assuming first spa-page class is the home / hero page
let spaCurrentPageID = spaHomePageID;

{
    const pages = document.getElementsByClassName("spa-page");

    for (let el of pages) {
        el.style.display = 'none';
    }
}

function spaTop(){
    document.getElementById(spaCurrentPageID).scrollIntoView();
}

function spaBottom(){
    document.getElementById(spaCurrentPageID).scrollIntoView(false);
}

function spaGoTo(id) {
    document.getElementById(spaCurrentPageID).style.display = 'none';
    document.getElementById(id).style.display = 'block';
    spaCurrentPageID = id;
    spaTop();
}

spaGoTo(spaHomePageID); // Can be overridden with <body onload="spaGoTo(id);"> in the html`
