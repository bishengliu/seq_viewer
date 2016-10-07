This is the js API for viewing plasmid sequence. version 1.0.0. 2016-10-07.
```
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
  
```