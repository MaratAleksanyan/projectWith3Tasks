/*
* Задача 2
* Было некое противоречие, недопонимание по тексту и примеры задачи и по моему
* convert() и import() это одно и та же функция.
* Я реализовал так:
* Функция convert() возвращает из текстового шаблона HTML.
* Выражения внутри {{}} преобразуются в HTML теги. например:  {{input}}, {{textarea:bla bla}}
* Все что написано внутри {{}} таким образом input: и textarea: конвертируется как значение этих тегов.
*
* Работаем только с input и textarea
* Можно было написать много кейсов для проверки, но этого не сделал, так как они очень и очень разные.
*/

function convert(){
    const parser = new DOMParser();
    let patternText = document.getElementById('pattern').value.trim();

    const contentDiv = document.getElementById('content');
    const patternWithHTMLTags = patternText.replace(/({{)(\w+)(\:)?(.*)}}/g, getHTMLTags);
    const parsedPattern = parser.parseFromString(patternWithHTMLTags, 'text/html');

    contentDiv.innerHTML = "";
    contentDiv.innerHTML = parsedPattern.body.innerHTML;

    const divForButton = document.getElementById('forButton');
    const button = document.createElement('BUTTON');
    button.innerHTML = 'Export';
    button.setAttribute('id', 'export');
    button.setAttribute('onClick', 'exports()');
    divForButton.innerHTML = "";
    divForButton.append(button);

    function getHTMLTags(match, contents, offset, input_string, input_text){
        const inputValue = input_text ? `value="${input_text}"` : '';

        if(offset === 'input'){
            return `<${offset} ${inputValue} />`;
        }
        if(offset === 'textarea'){
            return `<${offset}> ${input_text} </${offset}>`;
        }
    }
}

/*
* Функция exports() возвращает из HTML текстовый шаблон.
* HTML теги преобразуются в текстовой шаблон. например:  <input value="Lorem Ipsum"> -> {{input:Lorem Ipsum}}
* Работаем только с input и textarea.
* Можно было написать много кейсов для проверки, но этого не сделал, так как они очень и очень разные.
*/

function exports(){
    const contentDiv = document.getElementById('content');
    const patternText = contentDiv.innerHTML;
    const parsedPattern = patternText.replace(/(<)(\w+)(( value=")?(.*)?(\")?)>/g, getTextFromHTML);

    function getTextFromHTML(match, contents, offset, input_string, input_text){
        const inputValue = input_string.split('"')[1] ? ":" + input_string.split('"')[1] : "";

        if(offset === 'input'){
            return `\{\{${offset}${inputValue}\}\}`;
        }
        if(offset === 'textarea'){
            return `\{\{${offset}:${input_string.slice(1).split('</')[0]}\}\}`;
        }
    }
    console.log(parsedPattern)
}

