function walk(rootNode) {
    // Find all the text nodes in rootNode
    const walker = document.createTreeWalker(
        rootNode,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    let node;
    // Modify each text node's value
    while (node = walker.nextNode()) {
        handleText(node);
    }
}

function handleText(textNode) {
    textNode.nodeValue = replaceText(textNode.nodeValue);
}

function replaceText(v) {

    v = v.replace(/([A-Z]?[a-z]+)[:*_·][A-Z]?[a-z]+/g, "$1");
    v = v.replace(/([A-Z]?[a-z]+)\/-[A-Z]?[a-z]+/g, "$1");

    v = v.replace(/([A-Z]?[a-z]+)\/innen/g, "$1");
    v = v.replace(/([A-Z]?[a-z]+)\(innen\)/g, "$1");
    v = v.replace(/([A-Z]?[a-z]+)\(in\)/g, "$1");
    v = v.replace(/([A-Z]?[a-z]+)\(inn\)en/g, "$1en");
    v = v.replace(/([A-Z]?[a-z]+)Innen/g, "$1");
    v = v.replace(/([A-Z]?[a-z]+)In/g, "$1");
    v = v.replace(/([A-Z]?[a-z]+)[A-Z]/g, "$1");

    v = v.replace(/([A-Z]?[a-z]+)en\/\1innen/g, "$1en");
    v = v.replace(/([A-Z]?[a-z]+)innen\/\1/g, "$1");
    v = v.replace(/([A-Z]?[a-z]+)en und \1innen/g, "$1en");
    v = v.replace(/([A-Z]?[a-z]+) und \1innen/g, "$1");

    return v;
}

// Returns true if a node should *not* be altered in any way
function isForbiddenNode(node) {
    return node.isContentEditable || // DraftJS and many others
        (node.parentNode && node.parentNode.isContentEditable) || // Special case for Gmail
        (node.tagName && (node.tagName.toLowerCase() === "textarea" || // Some catch-alls
            node.tagName.toLowerCase() === "input"));
}

// The callback used for the document body and title observers
function observerCallback(mutations) {
    var i, node;

    mutations.forEach(function (mutation) {
        for (i = 0; i < mutation.addedNodes.length; i++) {
            node = mutation.addedNodes[i];
            if (isForbiddenNode(node)) {
                // Should never operate on user-editable content
            } else if (node.nodeType === 3) {
                // Replace the text for text nodes
                handleText(node);
            } else {
                // Otherwise, find text nodes within the given node and replace text
                walk(node);
            }
        }
    });
}

// Walk the doc (document) body, replace the title, and observe the body and title
function walkAndObserve(doc) {
    const docTitle = doc.getElementsByTagName('title')[0];
    const observerConfig = {
        characterData: true,
        childList: true,
        subtree: true
    };

    // Do the initial text replacements in the document body and title
    walk(doc.body);
    doc.title = replaceText(doc.title);

    // Observe the body so that we replace text in any added/modified nodes
    const bodyObserver = new MutationObserver(observerCallback);
    bodyObserver.observe(doc.body, observerConfig);

    // Observe the title so we can handle any modifications there
    if (docTitle) {
        const titleObserver = new MutationObserver(observerCallback);
        titleObserver.observe(docTitle, observerConfig);
    }
}

walkAndObserve(document);
