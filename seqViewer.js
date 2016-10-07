//this is the js API for viewing plasmid sequence. version 1.0.0. 2016-10-07. Author: Bisheng Liu, bishengliu@gmail.com
//HOWTO

/*
    var data = {
                    id: "#displaySeq", //id of the seqViewer div
                    searchId: "#seqSearch", //search id 
                    sequence: sequence, //sequence
                    features: features, //feature array
                    enzymes: enzymes
                };
    //draw the seqViewer
    var sv = new seqViewer();
    sv.read(data);
    sv.draw();
    //redraw the svg when changing the page size
    $(window).resize(function (){
        sv.redraw();
    });
*/

function seqViewer(){
    var id ="",
        searchId = "",
        sequence = '',
        features = [],
        enzymes = [];
    
        //other global variables
        //get the window width
        var wWidth = 0; //padding on each side
        var ntPerLine = 0; //nt10 and sp 
        //ntPerLine: the number of nt perline
        //var ntPerLine = 230;

        //generate complementary sequence
        var cSequence = '';

        //show complementary sequence
        var showComplementary = true;
        var symbol = ' ';
        //generate sequence array based on the ntPerLine
        var seqArray = []; //array for forward sequence
        var cSeqArray = []; //array for complementary sequence
        var searchArray =[]; //array for search
        var yPosArray =[];
        var xShift = 25 // for adding count and vertical line
        //use d3 to display seq in text and as well as the features
        //div id is displaySeq
        //draw canvas
        //seqWidth and featureWdith will be calculated later
        //define the seqWidth
        var seqTop =5;
        var seqBottom = 10;

        var seqWidth = 20;
        //enzyme width
        var enzymeWidth = 10;
        //featureWdith 
        var featureWdith = 20;
        var arrayLength = seqArray.length;

    
    this.read = function(json){
        id = json.id,
        searchId = json.searchId,
        sequence = json.sequence,
        features = json.features,
        enzymes = json.enzymes;

        features.sort(sortByProperty('start'));
        enzymes.sort(sortByProperty('cut'));
        //set the global variables
        //get the window width
        wWidth = $(id).width() - 20 * 2; //padding on each side
        //define 10nt width 70.16, sp = 8.50
        ntPerLine = Math.trunc((wWidth/(70.16+ 8.50))) * 10; //nt10 and sp 
        ntPerLine = ntPerLine < 5 ? 5: ntPerLine;

        //generate complementary sequence
        cSequence = genCSeq(sequence);
        //generate sequence array based on the ntPerLine
        seqArray = formatSeq(sequence, symbol, ntPerLine); //array for forward sequence
        searchArray = genSearchArray(seqArray);
        cSeqArray = formatSeq(cSequence, symbol, ntPerLine); //array for complementary sequence

        arrayLength = seqArray.length;

    }

    this.draw = function(){
        //search div
        if($(searchId)){
            addSearchDiv(searchId);
        }
        
        //search
        (function(){
            //remove all non letter in the seqeuce input
            $('#search-seq').keyup(function () {
                var before = $('#search-seq').val();
                //strip out non-alpha characters and convert to uppercase
                var after = before.replace(/[^a-zA-Z]+|\s+$|[0-9]+/g, '').toUpperCase();
                after = after.replace(/[bdefhijklmnopqrsuvwxyzBDEFHIJKLMNOPQRSUVWZYX]+|\s+$|[0-9]+/g, '').toUpperCase();
                $('#search-seq').val(after);

                //remove all the rect with class "searchRect";
                d3.selectAll("rect.searchRect").remove();
                //make search
                var text = $("#search-seq").val();
                console.log(text);
                debugger;
                if(text != null && text != ""){
                    //perform search and return the index
                    var indexArray = searchSeq(text, sequence);              
                    if(indexArray.length >0){
                        //get all the index
                        var postions =  genPositions(indexArray, text.length);
                            //draw rect for search
                            var index=0;
                            var searchRect = d3.select("#seq-Search").append("g");
                            for(i=0; i< seqArray.length; i++){
                                for(s=0; s < searchArray[i].length; s++){
                                    if(postions.indexOf(+searchArray[i][s]) != -1){
                                        searchRect.append("rect")
                                                            .attr("class", function(){ return searchArray[i][s] == ' '? "searchRect searchRect-space" : "searchRect searchRect-" + searchArray[i][s]; })
                                                            .style("fill", "#e6e600")
                                                            .style("opacity", 0.5)
                                                            .attr("x", function(d){ return xShift + s * 7.15; })
                                                            .attr("y", yPosArray[i] - seqWidth + 8)
                                                            .attr("width", 7.15)
                                                            .attr("height", seqWidth - 5);
                                    }
                                index++
                                }
                            }
                    }
                }
                //end search
            });
        })();

        //draw svg
        var svg = drawSVG(id, arrayLength, seqTop, enzymeWidth, seqWidth, featureWdith, seqBottom);

        //draw forward seq and complementary sequence
        var svgSeq= drawSeq(svg, seqArray, symbol, showComplementary, cSeqArray, seqTop, enzymeWidth, seqWidth, featureWdith, seqBottom, ntPerLine, features, searchArray, yPosArray, xShift, enzymes);
    }

    //redraw the seq viewer
    this.redraw = function(){

        $(id).empty();
        //cal the width again
        //get the window width
        wWidth = $(id).width() - 20 * 2; //padding on each side
        //define 10nt width 70.16, sp = 8.50
        ntPerLine = Math.trunc((wWidth/(70.16+ 8.50))) * 10; //nt10 and sp 
        //ntPerLine: the number of nt perline
        //var ntPerLine = 230;
        ntPerLine = ntPerLine < 5 ? 5: ntPerLine;
        //draw svg
        var svg = drawSVG(id, arrayLength, seqTop, enzymeWidth, seqWidth, featureWdith, seqBottom);

        //draw forward seq and complementary sequence
        var svgSeq= drawSeq(svg, seqArray, symbol, showComplementary, cSeqArray, seqTop, enzymeWidth, seqWidth, featureWdith, seqBottom, ntPerLine, features, searchArray, yPosArray, xShift, enzymes);
    }
}

//functions
//render google color
function colores_google(n) {
    var colores_g = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
    return colores_g[n % colores_g.length];
}

//generate complementary sequence
function genCSeq(sequence){
    var cSequence ="";
    var cSeqArray = [];
    var seqArray = sequence.toUpperCase().split('');
    $.each(seqArray, function(i, d){
        if(d === "A"){
            cSeqArray.push("T")
        }
        else if(d==="T"){
            cSeqArray.push("A")
        }
        else if(d==="G"){
            cSeqArray.push("C")
        }
        else{
            cSeqArray.push("G")
        }
    })
    return cSeqArray.join('');
}

//generate sequence that split with a symbol every 10 nt and output the array
function formatSeq(sequence, symbol, ntPerLine){
    var outputArray = [];
    var array = sequence.match(new RegExp('.{1,' + ntPerLine + '}', 'g')).join('|').split('|');
    $.each(array, function (i, d) { 
        var itemSeq = d.match(/.{1,10}/g).join(symbol);
        outputArray.push(itemSeq);
     })
     return outputArray;
}

//gensearch array
function genSearchArray(seqArray){
    var outputArray = [];
    var index = 0;
    $.each(seqArray, function(i, d){
        var array = [];
        dArray = d.split('');
        $.each(dArray, function(si, sd){
            if(sd != " "){
            array.push(index.toString());
            index++;
            }
            else{
                array.push(" ");
            }
        })        
        outputArray.push(array);
    })
    return outputArray;
}

//draw empty using d3
function drawSVG(id, arrayLength, seqTop, enzymeWidth, seqWidth, featureWdith, seqBottom) { 
    var margin = {top: 20, right: 20, bottom: 20, left: 20};
    width = +$(id).width() - margin.left - margin.right;
    height = arrayLength * ( seqTop + enzymeWidth  + seqWidth + featureWdith + seqBottom + features.length*3) - margin.top - margin.bottom;
    //calculate the width
    var svg = d3.select(id)
                .append("svg")
                .attr("width", width + margin.left + margin.right)
			    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                        .attr("transform", "translate(" + margin.left +"," + margin.top + ")");
    return svg;
}


 //draw sequence and features
function drawSeq(svg, seqArray, symbol, showComplementary, cSeqArray, seqTop, enzymeWidth, seqWidth, featureWdith, seqBottom, ntPerLine, features, searchArray, yPosArray, xShift, enzymes) { 
    var yPos = 25;
    yPosArray.push(yPos);
    var count = 1;
    var yShift = 10;
    //define 10nt width 70.16, sp = 8.50
    // var nt10 = 78.015625;
    // var sp = 23.40625 - (78.015625/10)*2;

    var nt10 = 70.16;
    var sp = 8.50;

    //the with of the middle line between seq
    var middleWidth = 6;
    svg.append("g").attr("id", "seq-Search");
    svgSeq = svg.append("g").attr("id", "seqSVG");
    for(i=0; i< seqArray.length; i++){
    
    ////////////////////////////////////////////////////////
    //draw feature first
    //cal the y pos based on features
    //get current seq range
    var seqStart = ntPerLine * i + 1;
    var seqEnd = seqStart + ntPerLine;

    //first get the features that cover the whole range, complete overlapping features
    var coFeatures = $.grep(features, function (f, i) { 
        return f.start <= seqStart && f.end >= seqEnd;
     })
     //draw coFeatures
     var fWidth = 8;

     //calculate the feature rect width
     $('body').append('<div id="measure-text-width" class="nt-text-width">A G</div>');
     var rectWidth = $("#measure-text-width").text(seqArray[0]).width();
     $("#measure-text-width").remove();

     var coStep = 10; //vertical space between each feature
     var fNewWdith =0;
     if(coFeatures.length >=1){
     var feature = svgSeq.append("g");
        for(f = 0; f < coFeatures.length; f++){
            //feature line
             var featureRect = feature.append("line")
                                .data([coFeatures[f]]) //pass the data for mouse on events
                                .attr("class", function(){ return formatName(coFeatures[f].name, "line"); })
                                .style("stroke", coFeatures[f].color)
                                .style("stroke-opacity", 0.6)
                                .attr("x1", xShift)
                                .attr("y1", yPos + (seqWidth - 3 + coStep) * (f+1))
                                .attr("x2", xShift + rectWidth)
                                .attr("y2", yPos + (seqWidth - 3 + coStep) * (f+1));
                                //add mouse eevents
                                featureRect.on("mouseover", function(d){
                                    //get the class
                                    var lineClass = '.'+ formatName(d.name, "line");
                                    var rectClass = '.'+formatName(d.name, "rect");
                                    var seqClass = '.' + formatName(d.name, "seq");
                                    d3.selectAll(lineClass).style("stroke-opacity", 1)
                                    d3.selectAll(rectClass).style("opacity", 0.5);
                                    d3.selectAll(seqClass).style("opacity", 0.1);
                                })
                                .on("mouseout", function(d){
                                    //get the class
                                    var lineClass = '.'+ formatName(d.name, "line");
                                    var rectClass = '.'+formatName(d.name, "rect");
                                    var seqClass = '.' + formatName(d.name, "seq");
                                    d3.selectAll(lineClass).style("stroke-opacity", 0.6)
                                    d3.selectAll(rectClass).style("opacity", 0.1);
                                    d3.selectAll(seqClass).style("opacity", 0.0);
                                });
            //hidden rect the span the seq
            var seqRect = svgSeq.append("rect")
                                .data([coFeatures[f]]) //pass the data for mouse on events
                                .attr("class", function(){ return formatName(coFeatures[f].name, "seq"); })
                                .style("fill", coFeatures[f].color)
                                .style("opacity", 0.0)
                                .attr("x", xShift)
                                .attr("y", yPos - seqWidth)
                                .attr("width", rectWidth)
                                .attr("height", 2*seqWidth+middleWidth);
            
            //label rect
            var featureBg = feature.append("rect")
                                .data([coFeatures[f]]) //pass the data for mouse on events
                                .attr("class", function(){ return formatName(coFeatures[f].name, "rect"); })
                                .style("fill", coFeatures[f].color)
                                .style("opacity", 0.1)
                                .attr("x", xShift + rectWidth / 2 - (coFeatures[f].name.split('').length + 10 ) * 7/2 )
                                .attr("y", yPos + (seqWidth - 3 + coStep) * (f + 1))
                                .attr("width", (coFeatures[f].name.split('').length + 10  ) * 7)
                                .attr("height", 1.2*yShift);
                                //add mous eevents
                                featureBg.on("mouseover", function(d){
                                    //get the class
                                    var lineClass = '.'+ formatName(d.name, "line");
                                    var rectClass = '.'+formatName(d.name, "rect");
                                    var seqClass = '.'  +formatName(d.name, "seq");
                                    d3.selectAll(lineClass).style("stroke-opacity", 1)
                                    d3.selectAll(rectClass).style("opacity", 0.5);
                                    d3.selectAll(seqClass).style("opacity", 0.1);
                                })
                                .on("mouseout", function(d){
                                    //get the class
                                    var lineClass = '.'+ formatName(d.name, "line");
                                    var rectClass = '.'+formatName(d.name, "rect");
                                    var seqClass = '.' +formatName(d.name, "seq");
                                    d3.selectAll(lineClass).style("stroke-opacity", 0.6)
                                    d3.selectAll(rectClass).style("opacity", 0.1);
                                    d3.selectAll(seqClass).style("opacity", 0.0);
                                });
            //label
            var featureLabel = feature.append("text")
                                .attr("class", "noEvent")
                                .attr("y", yPos + (seqWidth - 3 + coStep) * (f+1) + yShift)
                                .attr("x", xShift + rectWidth / 2)
                                .style("text-anchor", "middle")
                                .style("font-family", "monospace")
                                .style("font-size", "10px")
                                .style("fill", function () { return coFeatures[f].color; })
                                .text(function(){return (coFeatures[f].clockwise===0? ">>>> " : "<<<< ") + coFeatures[f].name  + (coFeatures[f].clockwise===0? " >>>>" : " <<<<"); });
        //add up the width
        fNewWdith =  fNewWdith + (seqWidth - 3 + coStep);
        }
     }
     
     var prefNewWdith = fNewWdith;
     //get all the features located in the range or partially overlapped
     //1: features do not start in the range, but end in the range
     //2: features start in the range but not end in the range
     //3: features start and also end in the range
    var poFeatures = $.grep(features, function (f, i) { 
            return ((f.start < seqStart && f.end > seqStart && f.end < seqEnd)|| (f.start > seqStart && f.start < seqEnd && f.end > seqEnd) || (f.start > seqStart && f.end < seqEnd) );
    })
    //sort array by start
    poFeatures.sort(sortByProperty('start'));
    // //line# of features
    var line = 0;
    var fLine =[];
    var total = poFeatures.length;
    for(a=0; a< total; a++){
        fLine.push([]);
    }
    if(total > 0){
        if(poFeatures.length === 1 ){
            fLine[0].push(poFeatures[0]);
        }
        else{
            //>1
            var rFeature = poFeatures[poFeatures.length - 1];
            fLine[line].push(rFeature);
            poFeatures.pop();

            while(true){                
                if(poFeatures.length ===0){
                    break;
                }

                poFeatures.sort(sortByProperty('start'));
                var tempArray = [];

                if(poFeatures.length ===1){
                    if(line==0){
                        if(poFeatures[0].end <= rFeature.start){
                            fLine[0].push(poFeatures[0]);
                            poFeatures.pop();
                        }
                        else{
                            fLine[1].push(poFeatures[0]);
                            poFeatures.pop();
                        }
                    }
                    else{
                        if(poFeatures[0].end <= rFeature.start){
                            fLine[line].push(poFeatures[0]);
                        }
                        else{
                            fLine[line+1].push(poFeatures[0]);
                        }                        
                        poFeatures.pop();
                    }                    
                }

                if(poFeatures.length ===0){
                    break;
                }

                var z = poFeatures.length;
                while(z--){                    
                    var lFeature = poFeatures[z]; 
                    if(lFeature.end <= rFeature.start){
                        fLine[line].push(lFeature);
                        rFeature = lFeature;
                        poFeatures.pop();
                    }
                    else{
                        tempArray.push(lFeature);
                        rFeature = lFeature;
                        poFeatures.pop();
                    }                
                }   
                
                if(tempArray.length == 0){
                    break;
                }else{
                    line++;
                    poFeatures = tempArray;
                    poFeatures.sort(sortByProperty('start'));               
                    rFeature = poFeatures[poFeatures.length - 1];
                    fLine[line].push(rFeature);
                    poFeatures.pop();
                }
            }
        }
    }
     //loop through the fLine array
     for(l=0; l < fLine.length; l++){
         if(fLine[l].length >0){
             fNewWdith =  fNewWdith + (seqWidth - 3  + coStep);
             var feature = svgSeq.append("g");
             for(k=0; k < fLine[l].length; k++){
            //feature line
            var featureRect = feature.append("line")
                                .data([fLine[l][k]]) //pass the data for mouse on events
                                .attr("class", function(){ return formatName(fLine[l][k].name, "line"); })
                                .style("stroke", fLine[l][k].color)
                                .style("stroke-opacity", 0.6)
                                .attr("x1", function(){
                                    var fStart = fLine[l][k].start <= seqStart ? 0: fLine[l][k].start % ntPerLine;
                                    return xShift + calRectWidth(rectWidth, ntPerLine, fStart);
                                })
                                .attr("y1", yPos + prefNewWdith + (seqWidth - 3 + coStep) * (l + 1))
                                .attr("x2", function(){
                                    var fEnd = fLine[l][k].end >= seqEnd ? ntPerLine : fLine[l][k].end % ntPerLine;                                    
                                    return xShift + calRectWidth(rectWidth, ntPerLine, fEnd);
                                })
                                .attr("y2", yPos + prefNewWdith + (seqWidth - 3 + coStep) * (l + 1));
                                //add mous eevents
                                featureRect.on("mouseover", function(d){
                                    //get the class
                                    var lineClass = '.'+ formatName(d.name, "line");
                                    var rectClass = '.'+formatName(d.name, "rect");
                                    var seqClass = '.' + formatName(d.name, "seq");
                                    d3.selectAll(lineClass).style("stroke-opacity", 1)
                                    d3.selectAll(rectClass).style("opacity", 0.5);
                                    d3.selectAll(seqClass).style("opacity", 0.1);
                                })
                                .on("mouseout", function(d){
                                    //get the class
                                    var lineClass = '.'+ formatName(d.name, "line");
                                    var rectClass = '.'+formatName(d.name, "rect");
                                    var seqClass = '.' + formatName(d.name, "seq");
                                    d3.selectAll(lineClass).style("stroke-opacity", 0.6)
                                    d3.selectAll(rectClass).style("opacity", 0.1);
                                    d3.selectAll(seqClass).style("opacity", 0.0);
                                });
            //hidden rect the span the seq
            var seqRect = svgSeq.append("rect")
                                .data([fLine[l][k]]) //pass the data for mouse on events
                                .attr("class", "featureRect")
                                .attr("class", function(){ return formatName(fLine[l][k].name, "seq"); })
                                .style("fill", fLine[l][k].color)
                                .style("opacity", 0.0)

                                .attr("x", function(){
                                    var fStart = fLine[l][k].start <= seqStart? 0 : fLine[l][k].start % ntPerLine;
                                    return xShift + calRectWidth(rectWidth, ntPerLine, fStart);
                                })
                                .attr("y", yPos - seqWidth)
                                .attr("width", function(){
                                    var fStart = fLine[l][k].start <= seqStart? 0 : fLine[l][k].start % ntPerLine;
                                    var fEnd = fLine[l][k].end >= seqEnd? ntPerLine : fLine[l][k].end % ntPerLine;
                                    return calRectWidth(rectWidth, ntPerLine, fEnd) - calRectWidth(rectWidth, ntPerLine, fStart);
                                })
                                .attr("height", 2*seqWidth+middleWidth);

            //label rect
            var featureBg = feature.append("rect")
                                .data([fLine[l][k]]) //pass the data for mouse on events
                                .attr("class", function(){ return formatName(fLine[l][k].name, "rect"); })
                                .style("fill", fLine[l][k].color)
                                .style("opacity", 0.1)
                                .attr("x", function(){
                                    var fStart = fLine[l][k].start <= seqStart? 0: fLine[l][k].start - seqStart;
                                    var fEnd = fLine[l][k].end >= seqEnd? ntPerLine : fLine[l][k].end - seqStart;
                                    return xShift + (calRectWidth(rectWidth, ntPerLine, fEnd) - calRectWidth(rectWidth, ntPerLine, fStart))/2 + calRectWidth(rectWidth, ntPerLine, fStart) - (fLine[l][k].name.split('').length + 10 ) * 7/2;
                                })
                                .attr("y", yPos + prefNewWdith + (seqWidth - 3 + coStep) * (l+1))
                                .attr("width", (fLine[l][k].name.split('').length + 10  ) * 7)
                                .attr("height", 1.2*yShift);

                                //add mous eevents
                                featureBg.on("mouseover", function(d){
                                    //get the class
                                    var lineClass = '.'+ formatName(d.name, "line");
                                    var rectClass = '.'+formatName(d.name, "rect");
                                    var seqClass = '.' + formatName(d.name, "seq");
                                    d3.selectAll(lineClass).style("stroke-opacity", 1)
                                    d3.selectAll(rectClass).style("opacity", 0.5);
                                    d3.selectAll(seqClass).style("opacity", 0.1);
                                })
                                .on("mouseout", function(d){
                                    //get the class
                                    var lineClass = '.'+ formatName(d.name, "line");
                                    var rectClass = '.'+formatName(d.name, "rect");
                                    var seqClass = '.' + formatName(d.name, "seq");
                                    d3.selectAll(lineClass).style("stroke-opacity", 0.6)
                                    d3.selectAll(rectClass).style("opacity", 0.1);
                                    d3.selectAll(seqClass).style("opacity", 0.0);
                                });

            //feature label
            var featureLabel = feature.append("text")
                                .attr("class", "noEvent")
                                .attr("y", yPos + prefNewWdith + (seqWidth - 3 + coStep) * (l+1) + yShift)
                                .attr("x", function(){
                                    var fStart = fLine[l][k].start <= seqStart? 0: fLine[l][k].start - seqStart;
                                    var fEnd = fLine[l][k].end >= seqEnd? ntPerLine : fLine[l][k].end - seqStart;
                                    return xShift + (calRectWidth(rectWidth, ntPerLine, fEnd) - calRectWidth(rectWidth, ntPerLine, fStart))/2 + calRectWidth(rectWidth, ntPerLine, fStart);
                                })
                                .style("text-anchor", "middle")
                                .style("font-family", "monospace")
                                .style("font-size", "10px")
                                .style("fill", function () { return fLine[l][k].color; })
                                .text(function(){return (fLine[l][k].clockwise===0? ">>>> " : "<<<< ") + fLine[l][k].name  + (fLine[l][k].clockwise===0? " >>>>" : " <<<<"); });


             }         
         }
     }
     ////////////////////////////////////////////////////
    //d3 search events ok for search
    d3.select("#ok-search")
      .on("click", function(){
          //remove all the rect with class "searchRect";
          d3.selectAll("rect.searchRect").remove();
          //get the seach search
          var text = $("#search-seq").val();
          if(text != null || text != ""){
              //perform search and return the index
              var indexArray = searchSeq(text, sequence);              
              if(indexArray.length >0){
                   //get all the index
                   var postions =  genPositions(indexArray, text.length);
                    //draw rect for search
                    var index=0;
                    var searchRect = d3.select("#seq-Search").append("g");
                    for(i=0; i< seqArray.length; i++){
                        for(s=0; s < searchArray[i].length; s++){
                            if(postions.indexOf(+searchArray[i][s]) != -1){
                                  searchRect.append("rect")
                                                    .attr("class", function(){ return searchArray[i][s] == ' '? "searchRect searchRect-space" : "searchRect searchRect-" + searchArray[i][s]; })
                                                    .style("fill", "#e6e600")
                                                    .style("opacity", 0.5)
                                                    .attr("x", function(d){ return xShift + s * 7.15; })
                                                    .attr("y", yPosArray[i] - seqWidth + 8)
                                                    .attr("width", 7.15)
                                                    .attr("height", seqWidth - 5);
                            }
                        index++
                        }
                    }
              }
          }
      })
      //clean search
    d3.select("#clear-search")
        .on("click", function(){
          //remove all the rect with class "searchRect";
          d3.selectAll("rect.searchRect").remove();
          //clear search input
          $("#search-seq").val(null);          
        })

    /////////////////////////////////////////////////////
    //draw the seq the last to allow mouse selection of the seq
    //forward sequence
    var fcSeq = svgSeq.append("g");
    //draw seq the last
    fcSeq.append("text")
                        .attr("y", yPos)
                        .attr("x", xShift)
                        .style("text-anchor", "begin")
                        .style("font-family", "monospace")
                        .style("font-size", "13px")
                        .style("fill", "#636363")
                        .text(seqArray[i]);
    //add nt count
    fcSeq.append("text")
                        .attr("y", yPos)
                        .attr("x", 0)
                        .attr("class", "noEvent")
                        .style("text-anchor", "middle")
                        .style("font-family", "monospace")
                        .style("font-size", "13px")
                        .style("fill", "#636363")
                        .text(count + "");
    //show middle nt count
    //first draw horizontal line
    //remove the symbol in the seqArrayItem
    var seqArrayItem = seqArray[i].split(symbol).join('');
    if(seqArrayItem.length == ntPerLine){
            for(c=0; c < Math.trunc(seqArrayItem.length / 10); c++){
                var hline= fcSeq.append("g").append("line")
                                .style("stroke", "#c7c7c7")
                                .style("stroke-width", 0.5)
                                .attr("x1", xShift + nt10/17 + c * (nt10 + sp))
                                .attr("y1", yPos + middleWidth) 
                                .attr("x2", xShift + nt10 - nt10/20 + c * (nt10 + sp)) 
                                .attr("y2", yPos + middleWidth);
            //draw small vertical lines
            for(v=0; v < 10; v++){
                var vline = fcSeq.append("g").append("line")
                                .style("stroke-width", 0.5)
                                .style("stroke", "#c7c7c7")
                                .attr("x1", xShift + c * (nt10 + sp) + nt10/17 + v * nt10/10)
                                .attr("y1", function () { return (v == 0 || v == 9 || v == 5) ? (yPos + 3) : (yPos + 4); }) 
                                .attr("x2", xShift + c * (nt10 + sp)+ nt10/17 + v * nt10/10)
                                .attr("y2", function () { return (v == 0 || v == 9 || v == 5) ? (yPos + 9) : (yPos + 8); });
                        }
            }
    }
    else{
        for(c=0; c < Math.trunc(seqArrayItem.length / 10); c++){
                var hline= fcSeq.append("g").append("line")
                                .style("stroke", "#c7c7c7")
                                .style("stroke-width", 0.5)
                                .attr("x1", xShift + nt10/17 + c * (nt10 + sp))
                                .attr("y1", yPos + middleWidth) 
                                .attr("x2", xShift + nt10 - nt10/20 + c * (nt10 + sp)) 
                                .attr("y2", yPos + middleWidth);
                //draw small vertical lines
                for(v=0; v < 10; v++){
                    var vline = fcSeq.append("g").append("line")
                                    .style("stroke-width", 0.5)
                                    .style("stroke", "#c7c7c7")
                                    .attr("x1", xShift + c * (nt10 + sp) + nt10/17 + v * nt10/10)
                                    .attr("y1", function () { return (v == 0 || v == 9 || v == 5) ? (yPos + 3) : (yPos + 4); }) 
                                    .attr("x2", xShift + c * (nt10 + sp)+ nt10/17 + v * nt10/10)
                                    .attr("y2", function () { return (v == 0 || v == 9 || v == 5) ? (yPos + 9) : (yPos + 8); });
                }
            }
        if(seqArrayItem.length % 10 !=0 ){
            var ntLeft = seqArrayItem.length % 10;
            var hline= fcSeq.append("g").append("line")
                                .style("stroke", "#c7c7c7")
                                .style("stroke-width", 0.5)
                                .attr("x1", xShift + nt10/17 + Math.trunc(seqArrayItem.length / 10) * (nt10 + sp))
                                .attr("y1", yPos + middleWidth) 
                                .attr("x2", xShift + nt10 * (ntLeft / 10 ) - nt10/20 + Math.trunc(seqArrayItem.length / 10)  * (nt10 + sp)) 
                                .attr("y2", yPos + middleWidth);
                                //draw small vertical lines
                for(v=0; v < ntLeft; v++){
                    var vline = fcSeq.append("g").append("line")
                                    .style("stroke-width", 0.5)
                                    .style("stroke", "#c7c7c7")
                                    .attr("x1", xShift + Math.trunc(seqArrayItem.length / 10) * (nt10 + sp) + nt10/17 + v * nt10/10)
                                    .attr("y1", function () { return (v == 0 || v == 9 || v == 5) ? (yPos + 3) : (yPos + 4); }) 
                                    .attr("x2", xShift + Math.trunc(seqArrayItem.length / 10) * (nt10 + sp)+ nt10/17 + v * nt10/10)
                                    .attr("y2", function () { return (v == 0 || v == 9 || v == 5) ? (yPos + 9) : (yPos + 8); });
                }
        }
    }
    
    //complementary sequence
    if(showComplementary){
                    fcSeq.append("text")
                        .attr("class", "noEvent")
                        .attr("y", yPos + seqWidth)
                        .attr("x", xShift)
                        .style("text-anchor", "begin")
                        .style("font-family", "monospace")
                        .style("font-size", "13px")
                        .style("fill", "#c7c7c7")
                        .text(cSeqArray[i]);
    }

   ////////////////////////////////////////////////////

    var startRegion = 0;
    var eRegion = 60; //length of one enzyme
    //get totoal howmany regions
    var regionNumber = Math.trunc(rectWidth / eRegion);

    var lineHeight = 10;  //emzyme line height, including labelHeight
    var gap = 2;
    var labelHeight = 5; //enzyme label
    var labelWidth = 10;

    var lLine = 0, lHeight = 0;
    var rLine =0, rHeight = 0;

    //get the enzymes lie in the range
    var enzyArray = $.grep(enzymes, function(e){
        return +e.cut >= seqStart && +e.cut <= seqEnd;
    });
    
    var enzySvg = svgSeq.append("g");
    
    for(p=0; p <= regionNumber; p++){
        rHeight = 0;
        var leftEnzymes = $.grep(enzyArray, function(el){
                            var ePos = calRectWidth(rectWidth, ntPerLine, +el.cut % ntPerLine);
                            return +ePos > startRegion && +ePos <= (startRegion + eRegion/2);
                        });
       var rightEnzymes = $.grep(enzyArray, function(er){
                            var ePos = calRectWidth(rectWidth, ntPerLine, +er.cut % ntPerLine);
                            return +ePos > (startRegion + eRegion/2) && +ePos <= (startRegion + eRegion);
                        });

      //draw right enzymes
      if(rightEnzymes.length > 0){
        rHeight = rightEnzymes.length * (labelHeight + gap + lineHeight);
        rLine = rHeight > rLine ? rHeight : rLine;
        $.each(rightEnzymes, function(ri, re){
            var enzy= enzySvg.append("g").data([re]);
            //get svg
            var ePos = calRectWidth(rectWidth, ntPerLine, re.cut % ntPerLine);
            enzy.append("line")
                                    .style("stroke-width", 0.2)
                                    .style("stroke", "gray")
                                    .attr("id", re.name.split(' ')[0] + '-' + re.cut + "-line")
                                    .attr("x1", xShift + ePos) // + 7.15/2
                                    .attr("y1", yPos - 10) 
                                    .attr("x2", xShift + ePos) // + 7.15/2
                                    .attr("y2", yPos - 10 - (lineHeight + gap) * ( 1 + ri ));
           //add hidden rect behind each enzyem label for mouse event
            enzy.append("rect")
                                .style("opacity", 0)
                                .attr("x", xShift + ePos)
                                .attr("y", yPos - 20 - (lineHeight + gap) * ( 1 + ri ))
                                .attr("width", 20)
                                .attr("height", 10);

            enzy.append("text")
                                    .attr("y", yPos - 10 - (lineHeight + gap)  * ( 1 + ri ))
                                    .attr("x", xShift + ePos)
                                    .attr("id", re.name.split(' ')[0] + '-' + re.cut + "-text")
                                    .attr("class", "noEvent")
                                    .style("text-anchor", "begin")
                                    .style("font-family", "monospace")
                                    .style("font-size", "10px")
                                    .style("fill", "gray")
                                    .text(function(){ return re.name.split(' ')[0]; });
            

            //mouse events
            enzy
            .on("mouseover", function(d){
                //get the ids
                var lineId = "#" + d.name.split(' ')[0] + '-' + d.cut +"-line";
                var textId = "#" + d.name.split(' ')[0]+ '-' + d.cut +"-text";
                d3.select(lineId).style("stroke", "red");
                d3.select(textId).style("fill", "red");
                //draw the enzyme area rect
                //ignore the enyzme that span two lines //////////////////////////////////////////////////////////////////////
                var y = yPosArray[Math.trunc(+d.start / ntPerLine)];
                d3.select('#seqSVG').append("rect")
                    .attr("id",  d.name.split(' ')[0] + '-' + d.cut + "-shadow")
                    .style("fill", "#3b3eac")
                    .style("opacity", 0.2)
                                .attr("x", function(){                                    
                                    return xShift + calRectWidth(rectWidth, ntPerLine, +d.start % ntPerLine);
                                })
                                .attr("y", +y-15)
                                .attr("width", function(){
                                    return calRectWidth(rectWidth, ntPerLine, +d.end % ntPerLine) - calRectWidth(rectWidth, ntPerLine, +d.start % ntPerLine);
                                })
                                .attr("height", 2*seqWidth );
            })
            .on("mouseout", function(d){
                //get the ids
                var lineId = "#" + d.name.split(' ')[0] + '-' + d.cut +"-line";
                var textId = "#" + d.name.split(' ')[0]+ '-' + d.cut +"-text";
                var shadow = "#" + d.name.split(' ')[0]+ '-' + d.cut +"-shadow";
                d3.select(lineId).style("stroke", "gray");
                d3.select(textId).style("fill", "gray");
                d3.select(shadow).remove();
            });
        })
      }


      //draw left enzymes
      if(leftEnzymes.length >0){
          lHeight = leftEnzymes.length * (labelHeight + gap) + lineHeight;
          lLine = lHeight > lLine? lHeight: lLine;
          leftEnzymes.sort(reverseSortByProperty('cut'));
          $.each(leftEnzymes, function(li, le){
              var enzy= enzySvg.append("g").data([le]);;
              //need to draw for left
              var ePos = calRectWidth(rectWidth, ntPerLine, le.cut % ntPerLine);
            enzy.append("line")
                                    .style("stroke-width", 0.2)
                                    .attr("id", le.name.split(' ')[0] + '-' + le.cut +"-line")
                                    .style("stroke", "gray")
                                    .attr("x1", xShift + ePos) // + 7.15/2
                                    .attr("y1", yPos - 10) 
                                    .attr("x2", xShift + ePos) // + 7.15/2
                                    .attr("y2", function(){
                                        return rHeight >0 ? yPos - 10 - (lineHeight + gap)  * ( li ) - rHeight:  yPos - 10 - (lineHeight + gap)  * ( 1 + li ) - rHeight;
                                    });
                                    //add hidden rect behind each enzyem label for mouse event
            enzy.append("rect")
                                .style("opacity", 0)
                                .attr("x", xShift + ePos)
                                .attr("y", function(){
                                        return rHeight > 0 ? yPos - 20 - (lineHeight + gap)  * ( li ) - rHeight:  yPos - 20 - (lineHeight + gap)  * ( 1 + li ) - rHeight;
                                    })
                                .attr("width", 20)
                                .attr("height", 10);
                                
            enzy.append("text")
                                    .attr("y", function(){
                                        return rHeight >0 ? yPos - 10 - (lineHeight + gap)  * ( li ) - rHeight:  yPos - 10 - (lineHeight + gap)  * ( 1 + li ) - rHeight;
                                    })
                                    .attr("x", xShift + ePos)
                                    .attr("id", le.name.split(' ')[0] + '-' + le.cut +"-text")
                                    .attr("class", "noEvent")
                                    .style("text-anchor", "begin")
                                    .style("font-family", "monospace")
                                    .style("font-size", "10px")
                                    .style("fill", "gray")
                                    .text(function(){ return le.name.split(' ')[0]; });
            enzy
            .on("mouseover", function(d){
                //get the ids
                var lineId = "#" + d.name.split(' ')[0] + '-' + d.cut +"-line";
                var textId = "#" + d.name.split(' ')[0]+ '-' + d.cut +"-text";
                d3.select(lineId).style("stroke", "red");
                d3.select(textId).style("fill", "red");
                //draw the enzyme area rect
                //ignore the enyzme that span two lines //////////////////////////////////////////////////////////////////////
                var y = yPosArray[Math.trunc(+d.start / ntPerLine)];
                d3.select('#seqSVG').append("rect")
                    .attr("id",  d.name.split(' ')[0] + '-' + d.cut + "-shadow")
                    .style("fill", "#3b3eac")
                    .style("opacity", 0.2)
                                .attr("x", function(){
                                    var sPos = calRectWidth(rectWidth, ntPerLine, +d.start % ntPerLine);
                                    return xShift + sPos;
                                })
                                .attr("y", +y-15)
                                .attr("width", function(){                                    
                                    return calRectWidth(rectWidth, ntPerLine, (+d.end) % ntPerLine) - calRectWidth(rectWidth, ntPerLine, (+d.start) % ntPerLine);
                                })
                                .attr("height", 2*seqWidth);           
            })
            .on("mouseout", function(d){
                //get the ids
                var lineId = "#" + d.name.split(' ')[0] + '-' + d.cut +"-line";
                var textId = "#" + d.name.split(' ')[0]+ '-' + d.cut +"-text";
                var shadow = "#" + d.name.split(' ')[0]+ '-' + d.cut +"-shadow";
                d3.select(lineId).style("stroke", "gray");
                d3.select(textId).style("fill", "gray");
                d3.select(shadow).remove();
            });
          })
      }

        //move to next region
        startRegion += eRegion;
    }

   //////////////////////////////////////////////////

   //cal the feature height
     featureHeight = fNewWdith === 0 ? featureWdith : fNewWdith;
    
    
    //cal the enzymeWidth
    enzymeWidth = (lLine + rLine < 10 ? 10 : lLine + rLine) + 15;
    

    yPos = yPos + seqTop + enzymeWidth  + seqWidth + featureHeight + seqBottom;
    yPosArray.push(yPos);
    //cal the count 
    count = count + ntPerLine;
    }
    //draw vertical line after ntcount
    svgSeq.append("line")
            .style("stroke", "#c7c7c7")
            .attr("x1", xShift -5)     // x position of the first end of the line
            .attr("y1", 5 - enzymeWidth- seqTop)             // y position of the first end of the line
            .attr("x2", xShift -5)     // x position of the second end of the line
            .attr("y2", yPos);    // y position of the second end of the line

    //re-cal the svg height
    d3.select("svg").transition().duration(1000).attrTween("height", function(d, i, a){return d3.interpolate(0, yPos + 50)});
    return svgSeq;
  }

function sortByProperty(property) {
    'use strict';
    return function (a, b) {
        var sortStatus = 0;
        if (a[property] < b[property]) {
            sortStatus = -1;
        } else if (a[property] > b[property]) {
            sortStatus = 1;
        }
        return sortStatus;
    };
}
function reverseSortByProperty(property) {
    'use strict';
    return function (a, b) {
        var sortStatus = 0;
        if (a[property] < b[property]) {
            sortStatus = 1;
        } else if (a[property] > b[property]) {
            sortStatus = -1;
        }
        return sortStatus;
    };
}


//cal the rectWidth
function calRectWidth(totalWidth, ntPerLine, ntPos){
    if(ntPos % 10 == 0){
            return ntPos/ntPerLine * totalWidth;
    }
    else{
        //hard-coded //see line 56
        return Math.trunc(ntPos / 10) * ((70.16+ 8.50)) + (ntPos % 10 * 70.16/10); 
    }
}

//format feature for class
function formatName(name, type){
    var nameArray = name.split('');
    var finalArray = [];
    $.each(nameArray, function(i, d){
        if(i==0){
            if((/[a-zA-Z]/.test(d))){
                finalArray.push(d);
            }
        }
        else{
            if((/[a-zA-Z0-9]/.test(d))){
                finalArray.push(d);
            }
        }
    })
    return finalArray.join('')+"-"+type;
}

//add search div
function addSearchDiv(id){
    var html = '';
    html += '<div class="col-xs-12 col-sm-8 col-md-6 pull-right">';
        html +='<div class="input-group">';
            html +='<span class="input-group-addon">Search </span>';
            html +='<input type="text" class="form-control" placeholder="sequence" id="search-seq">';
            html +='<span class="input-group-btn">';
                // html +='<button class="btn btn-default" type="button" id="ok-search"><i class="glyphicon glyphicon-search"></i></button>';
                html +='<button class="btn btn-default" type="button" id="clear-search"><i class="glyphicon glyphicon-remove"></i></button>';
            html +='</span>';
        html +='</div>';
    html +='</div><br/><br/>';

    $(id).append(html);
}

//find all the indexes; for search
function searchSeq(subSeq, sequence){
    var indexArray =[];
    for(index =0; index < (sequence.length - subSeq.length); index += subSeq.length){
        index = sequence.indexOf(subSeq, index);
        if(index ==-1){
            return indexArray;
        }
        indexArray.push(index);
    }
    return indexArray;
}

//find all the positions of the search
function genPositions(array, seqLength){
    var outPut =[];
    for(i=0; i < array.length; i++){
        var item = array[i];
        for(l=0; l< seqLength; l++){
            outPut.push(item + l);
        }
    }
    return outPut;
}
