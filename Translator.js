var knownFunctionList = ["Cos", "Sin", "Tan", "Atn", "Log", ""];

function onKeyPress(e)
{
    if(e.keyCode == 13)
    {
        $("#output").val(
            replaceArrayKako($("#input").val())
            );
    }
}

function replaceArrayKako(code) {
    var searchedStart = 0;
    var searchedEnd = code.length;
    for (var i = 0; i < code.length; i++) {
        if (code[i] == "(") {
            var j = i + 1;
            var count = 1;
            while (j < code.length) {
                if (code[j] == "(")
                    count++;
                else if (code[j] == ")")
                    count--;
                if (count == 0) {
                    searchedStart = i;
                    searchedEnd = j;
                    var frontSub = "";
                    var k = searchedStart - 1;
                    while(k >= 0) {
                        var ascii = code[k].charCodeAt(0);
                        if(
                        (ascii >= 48 && ascii < 57)||
                        (ascii >= 65 && ascii < 90) ||
                        (ascii >= 97 && ascii < 122)) {
                            frontSub = code[k] + frontSub;
                            k--;
                        }
                        else
                            break;
                    }
                    if(!knownFunctionList.includes(frontSub))
                    {
                        code = code.replaceAt(searchedStart, "[");
                        code = code.replaceAt(searchedEnd, "]");
                    }
                    break;
                }
                j++;
            }
        }
    }

    return code;
}

String.prototype.replaceAt=function(index, replacement) {
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}
