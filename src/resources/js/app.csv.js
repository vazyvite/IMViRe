var CSV = function () {
    const fs = require('fs');
    const csv = require('fast-csv');
    const protectedInfos = ["id"];
    let csvData = [];
    let headers = [];
    let that = this;
    let widthElBloc = parseInt(localStorage.getItem("widthElBloc")) || 5;
    let historique = [];

    /**
     * Effectue des corrections de format au niveau du Header de la colonne.
     * @param {string} header   le titre de la colonne
     * @param {string} headers  tous les titres des colonnes déjà définis
     */
    function formatHeader(header) {
        if (header) {
            header = header.trim();
            header = header.replace(/\s/g, "_");

            if (headers.indexOf(header) != -1){
                let counter = 1;
                while (headers.indexOf(header + counter) != -1) {
                    counter ++;
                }
                header = header + counter;
            }
        }
        return header;
    }

    /**
     * drawElement - Ajoute un nouvel élément à l'écran
     *
     * @param  {type} csvLine l'objet correspondant à une ligne CSV
     */
    function drawElement(csvLine) {
        if (csvLine) {
            let $elBloc = $("<button>").addClass("btn btn btn-light elBloc").appendTo("#elContainer");
            let listeChildren = getDirectChildrenLinesById(csvLine.id);
            let $children = null;

            // affichage de l'état (couleur)
            if (csvLine.hasOwnProperty("etat")) {
                $elBloc.addClass("alert etat" + csvLine.etat);
            }

            // gestion des données techniques et de la largeur du bloc
            if (csvLine.hasOwnProperty("id")) {
                $elBloc.attr({
                    "data-id": csvLine.id,
                    "data-idParent": csvLine.idParent,
                    "data-children": listeChildren.length,
                    "title": "Accéder au contenu de l'élément " + csvLine.titre
                }).css({
                    "width": widthElBloc + "%",
                    "max-width": widthElBloc + "%"
                });
            }

            // affichage du titre
            if (csvLine.hasOwnProperty("titre")) {
                $("<span>").addClass("elBloc-title").text(csvLine.titre).appendTo($elBloc);
            }

            // affichage de la liste des enfants
            $children = $("<span>").addClass("elBloc-children").appendTo($elBloc);
            $("<span>").addClass("elBloc-children-nb").text(listeChildren.length).appendTo($children);
            $("<span>").addClass("fas fa-sitemap").appendTo($children);
        }
    }

    function drawInfosElement(csvLine) {
        if (csvLine) {
            let $elInfosContainer = $("#elInfosContainer");
            let $infoContainer = $("<div>").appendTo("#infos-additionnal-content");
            let info = null;
            let $formGroup = null;
            let $label = null;
            let $input = null;
            let $target = null;
            let valeur = null;
            let date = null;

            for (info in csvLine) {
                $target = $elInfosContainer.find("[data-bind='" + info + "']");
                if ($target && $target.length) {
                    if (info == "date_creation") {
                        date = new Date((parseInt(csvLine[info]) - (25567 + 1))*86400*1000);
                        valeur = ((date.getDate() < 10) ? "0" : "") + date.getDate() + "/" + ((date.getMonth() < 10) ? "0" : "") + date.getMonth() + "/" + date.getFullYear()
                    } else {
                        valeur = csvLine[info];
                    }
                    $target.val(valeur);
                } else {
                    $formGroup = $("<div>").addClass("form-group").appendTo($infoContainer);
                    $label = $("<label>").addClass("control-label-custom").attr({
                        "for": "id_" + info,
                        "data-bind": info
                    }).text(info).appendTo($formGroup);
                    $input = $("<input>").attr({
                        "type": "text",
                        "id": "id_" + info
                    }).addClass("form-control").val(csvLine[info]).appendTo($formGroup)
                }
            }
        }
    }

    /**
     * getLineById - Récupère un élément à partir de son identifiant
     *
     * @param  {string} id l'identifiant de l'élément
     * @returns {object}    l'objet correspondant à la ligne CSV
     */
    function getLineById(id) {
        let line = null;
        csvData.forEach(function (dataline) {
            if (dataline.id == id) {
                line = dataline;
            }
        })
        return line;
    }

    /**
     * Retourne la liste des éléments correspondants au titre recherché
     * @param {string} titre le titre de l'élément recherché
     * @returns {Array} la liste des éléments portant le titre recherché
     */
    function getLinesByTitre(titre) {
        let lines = [];
        csvData.forEach(function (dataline) {
            if (dataline.titre == titre) {
                lines.push(dataline);
            }
        })
        return lines;
    }

    /**
     * Retourne la liste des parents associés à un élément
     * @param {string} id l'id de l'élément pour lequel on recherche les parents
     * @returns {Array} la liste des parents associés à l'élément
     */
    function getParentsLinesForId(id) {
        let parents = [];
        let line = getLineById(id);
        parents.push(line);
        while(line.idParent != "") {
            line = getLineById(line.idParent);
            if (!line) {
                break;
            } else {
                parents.push(line);
            }
        }
        return parents.reverse();
    }

    /**
     * Récupère la liste des enfants directs de la ligne
     * @param {string} id l'id de la ligne pour laquelle on souhaite récupérer les enfants
     * @returns {Array} la liste des lignes enfants 
     */
    function getDirectChildrenLinesById(id) {
        let lines = [];
        csvData.forEach(function (dataline) {
            if (dataline.idParent == id) {
                lines.push(dataline);
            }
        })
        return lines;
    }

    /**
     * attachEvents - Gestion des évènements
     */
    function attachEvents() {
        // Evènements d'interaction avec les éléments
        $("body").on("click", ".elBloc", function () {
            let id = $(this).attr("data-id");
            let idParent = $(this).attr("data-idParent");
            historique.push(getLineById(id));
            that.draw(id);
        });
        // Evènements sur le bouton de retour à l'élement précédent
        $("#ReturnToParent").on("click", function () {
            let id = $("#elContainer").attr("data-context");
            let i = 0;
            let idParent = "";
            for (i; i < csvData.length; i++) {
                if (csvData[i].id == id) {
                    idParent = csvData[i].idParent;
                    break;
                }
            }
            historique.pop();
            that.draw(idParent);
        });
        // Evènements sur le bouton de retour à la racine
        $("#ReturnToRoot").on("click", function () {
            historique = [];
            that.draw("");
        });
        // Evènements de gestion du scroll pour le zoom sur les éléments
        $('body').on('mousewheel', function(event) {
            if (event.deltaY > 0 && widthElBloc < 45) {
                widthElBloc += event.deltaY;
            } else if (event.deltaY < 0 && widthElBloc > 5) {
                widthElBloc += event.deltaY;
            }
            $(".elBloc").css({
                "width": widthElBloc + "%",
                "max-width": widthElBloc + "%"
            });

            localStorage.setItem("widthElBloc", widthElBloc);
            $("#stepWidthElBloc_text").text(widthElBloc + "%");
            $("#stepWidthElBloc").val(widthElBloc);
        });

        // Evènements sur le bouton de retour à un élément de l'historique (fil d'Ariane)
        $("body").on("click", ".btn-retour-historique", function () {
            let id = $(this).attr("data-id");
            let titreParent = getLineById(id).titre;
            let indexId = 0;
            historique.forEach(function (etape, index) {
                if (etape.titre == titreParent) {
                    indexId = index;
                    return false;
                }
            })
            historique.splice(indexId + 1);
            that.draw(id);
        });

        $("#searchButton").on("click", function () {
            let valSearch = $("#search").val();
            if (valSearch != "") {
                let lines = getLinesByTitre(valSearch);
                let idSearch = null;

                if (lines && lines.length && lines[0].hasOwnProperty("id")) {
                    idSearch = lines[0].id;
                    historique = [];
                    let listeParents = getParentsLinesForId(lines[0].id);
                    listeParents.forEach(function (parent) {
                        historique.push(parent);
                    });
                    that.draw(idSearch);
                }
            }
        });
    }

    /**
     * resetElContainer - Réinitialise les éléments
     *
     * @param  {string} context le contexte d'affichage des éléments
     */
    function resetElContainer(context) {
        let $elContainer = $("#elContainer");
        $elContainer.children().remove();
        $("#infos-additionnal-content").children().remove();
        $elContainer.attr("data-context", context);
        $("#titleContext").text("");
    }

    /**
     * Peuple la liste des possibilités de recherche (liste d'autocomplétion)
     */
    function populateSearchList() {
        $("#elements").children().remove();
        csvData.forEach(function (dataline) {
            if (dataline.hasOwnProperty("titre")) {
                $("<option>").attr({
                    "value": dataline.titre
                }).appendTo("#elements");
                $("<option>").attr({
                    "value": dataline.id,
                    "label": dataline.titre
                }).appendTo("#elementsNumbers");
            }
        });
    }

    /**
     * interpreteContexte - interprète le contexte pour adapter l'IHM
     *
     * @param  {string} context le contexte de l'application
     */
    function interpreteContexte(context) {
        // gestion de l'affichage des boutons de navigation
        if (context != "") {
            $("#ReturnToParent, #ReturnToRoot").show();
        } else {
            $("#ReturnToParent, #ReturnToRoot").hide();
        }
        // traitement du focus
        if ($(".elBloc").length) {
            $(".elBloc:first").focus();
        } else {
            $("#ReturnToParent").focus();
        }
    }

    /**
     * drawHistorique - dessine la barre d'historique
     */
    function drawHistorique() {
        if (historique) {
            let i = 0;
            let $filariane = $("<ol>").appendTo("#titleContext");
            let $etape = null;
            let $button = null;
            for (i; i < historique.length; i++) {
                $etape = $("<li>").appendTo($filariane);
                $button = $("<button>").addClass("btn-retour-historique").text(historique[i].titre).attr("data-id", historique[i].id).appendTo($etape);
                if (i == historique.length - 1) {
                    $button.prop("disabled", true);
                }
            }
        }
    }

    /**
     * anonymous function - Initialise l'application
     */
    that.init = function () {
        $("#stepWidthElBloc_text").text(widthElBloc + "%");
        $("#stepWidthElBloc").val(widthElBloc + "%");
        attachEvents();
    };

    /**
     * Charge un csv.
     * @param {string} path le chemin d'accès au fichier CSV
     */
    that.load = function (path, callback) {
        let steam = fs.createReadStream(path);
        let counter = 0;
        let csvSteam = csv({delimiter: ';'}).on("data", function (dataLineCSV) {
            let objectCSV = {};
            dataLineCSV.forEach(function (dataCellule, index) {
                if (counter === 0) {
                    headers.push(formatHeader(dataCellule));
                } else {
                    objectCSV[headers[index]] = dataCellule;
                }
            });
            if (counter != 0) {
                csvData.push(objectCSV);
            }
            counter ++;
        }).on("end", function () {
            populateSearchList();
            callback();
        });

        steam.pipe(csvSteam);
    }

    /**
     * Réinitialise toutes les informations issues du CSV.
     */
    that.unload = function () {
        csvData = {};
        headers = [];
    }

    /**
     * anonymous function - dessine le CSV sous la forme d'un tableau
     */
    that.draw = function (context) {
        if (context === null || typeof context === "undefined") {
            context = "";
        }
        resetElContainer(context);
        let nbChildren = getDirectChildrenLinesById(context).length;
        if (nbChildren === 0) {
            drawInfosElement(getLineById(context));
        } else {
            csvData.forEach(function (dataLine) {
                if (dataLine.hasOwnProperty("idParent") && dataLine.idParent == context) {
                    drawElement(dataLine);
                }
            });
        }
        interpreteContexte(context);
        drawHistorique();
    }
}

module.exports = CSV;
