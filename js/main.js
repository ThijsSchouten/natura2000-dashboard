'use strict';

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/views/layers/FeatureLayerView",
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/geometry/geometryEngine",
  "esri/Graphic",
  "esri/renderers/smartMapping/statistics/uniqueValues",
  "esri/tasks/support/Query",
  "esri/widgets/LayerList",
  "esri/widgets/Fullscreen",
  "esri/core/watchUtils"
], function(Map, MapView, FeatureLayerView, FeatureLayer,
  GraphicsLayer, GeometryEngine, Graphic, uniqueValues, Query,
  LayerList, Fullscreen, watchUtils) {

  /************************************************************
   * Genereer dropdown menu met alle PZH-N2k gebieden
   ************************************************************/
  const pzh_n2k = ['Biesbosch', 'Boezems Kinderdijk',
    'Broekvelden, Vettenbroek & Polder Stein', 'Coepelduynen',
    'De Wilck', 'Donkse Laagten',
    'Duinen Goeree & Kwade Hoek', 'Grevelingen', 'Haringvliet',
    'Hollands Diep', 'Kennemerland-Zuid', 'Krammer-Volkerak',
    'Lingegebied & Diefdijk-Zuid', 'Meijendel & Berkheide',
    'Nieuwkoopse Plassen & De Haeck', 'Oude Maas',
    'Oudeland van Strijen',
    'Solleveld & Kapittelduinen', 'Voordelta', 'Voornes Duin'
  ]

  const dropdown = document.getElementById('n2k-dd')

  // Populate de dropdown
  pzh_n2k.forEach(function(info) {
    let option = document.createElement('option');
    option.value = "NAAM_N2k = '" + info + "'"
    let n2k = document.createTextNode(info);
    option.append(n2k)
    dropdown.appendChild(option)
  });

  // Voeg eventlistener toe 
  dropdown.addEventListener('change', function(event) {
    setFeatureLayerViewFilter(natura2000, event.target.value);
    zoomToFeature(natura2000, event.target.value, view);
  });

  /************************************************************
   * Setup de kaartjes
   ************************************************************/

  // Nieuwe map instance
  let map1 = new Map({
    basemap: "topo-vector"
  });

  let map2 = new Map({
    basemap: "topo-vector"
  });

  let map3 = new Map({
    basemap: "topo-vector"
  });

  // Nieuwe view instance
  let view = new MapView({
    map: map1,
    center: [4, 52],
    zoom: 9,
    spatialreference: 28992,
    container: "htkaart"
  });

  // Nieuwe view instance
  let view2 = new MapView({
    map: map2,
    center: [4, 52],
    zoom: 9,
    spatialreference: 28992,
    container: "lgkaart_nox"
  });

  // Nieuwe view instance
  let view3 = new MapView({
    map: map3,
    center: [4, 52],
    zoom: 9,
    spatialreference: 28992,
    container: "lgkaart_all"
  });



  [view, view2, view3].forEach(function(thisview) {
    // Verwijder de ESRI attributen
    thisview.ui._removeComponents(["attribution"]);

    // Fullscreen knoppie
    let fullscreen = new Fullscreen({
      view: thisview
    });
    thisview.ui.add(fullscreen, "bottom-left")

    // Layer lijst
    var layerList = new LayerList({
      view: thisview
    });
    thisview.ui.add(layerList, "top-right");
  })




  /************************************************************
   * FeatureLayers
   ************************************************************/

  let htkaart = new FeatureLayer({
    url: "https://services.arcgis.com/170JHtnttvl7hYmM/arcgis/rest/services/Natura2000/FeatureServer/1",
    outfields: ["*"],
    popupTemplate: {
      title: "{n2k_naam}",
      content: "Test"
    }
  });

  let lgkaart = new FeatureLayer({
    url: "https://services.arcgis.com/170JHtnttvl7hYmM/arcgis/rest/services/Natura2000/FeatureServer/2",
    outfields: ["*"],
    popupTemplate: {
      title: "{n2k_naam}",
      content: "Test"
    }
  });

  let natura2000 = new FeatureLayer({
    url: "https://services.arcgis.com/170JHtnttvl7hYmM/arcgis/rest/services/n2000_met_pas_kolom/FeatureServer/0",
    outfields: ["*"],
    popupTemplate: {
      title: "{NAAM_N2k}",
      content: "{BESCHERMIN}, {STATUS}"
    }
  });

  // Voeg featurelayer toe aan kaart
  map1.add(natura2000);
  map2.add(lgkaart);
  map3.add(htkaart);




  /************************************************************
   * Helper Functies
   ************************************************************/

  function zoomToFeature(featurelayer, expression, view) {
    let query = featurelayer.createQuery();
    query.where = expression;
    featurelayer.queryFeatures(query).then((response) => {

      console.log(response.features[0].geometry)
      view.goTo(response.features[0].geometry)
      //view2.goTo(response.features[0].geometry)
      //view3.goTo(response.features[0].geometry)
    })
  }

  function setFeatureLayerViewFilter(featurelayer, expression) {
    view.whenLayerView(featurelayer)
      .then((layerView) => {
        layerView.effect = {
          filter: {
            where: expression
          },
          excludedEffect: "opacity(20%)"
        }
      })
  };

  /************************************************************
   * utility method that synchronizes the viewpoint of a view to other views
   ************************************************************/

  var synchronizeView = function(view, others) {
    others = Array.isArray(others) ? others : [others];

    var viewpointWatchHandle;
    var viewStationaryHandle;
    var otherInteractHandlers;
    var scheduleId;

    var clear = function() {
      if (otherInteractHandlers) {
        otherInteractHandlers.forEach(function(handle) {
          handle.remove();
        });
      }
      viewpointWatchHandle && viewpointWatchHandle.remove();
      viewStationaryHandle && viewStationaryHandle.remove();
      scheduleId && clearTimeout(scheduleId);
      otherInteractHandlers = viewpointWatchHandle =
        viewStationaryHandle = scheduleId = null;
    };

    var interactWatcher = view.watch("interacting,animation",
      function(
        newValue
      ) {
        if (!newValue) {
          return;
        }
        if (viewpointWatchHandle || scheduleId) {
          return;
        }

        // start updating the other views at the next frame
        scheduleId = setTimeout(function() {
          scheduleId = null;
          viewpointWatchHandle = view.watch("viewpoint",
            function(
              newValue
            ) {
              others.forEach(function(otherView) {
                otherView.viewpoint = newValue;
              });
            });
        }, 0);

        // stop as soon as another view starts interacting, like if the user starts panning
        otherInteractHandlers = others.map(function(
        otherView) {
          return watchUtils.watch(
            otherView,
            "interacting,animation",
            function(value) {
              if (value) {
                clear();
              }
            }
          );
        });

        // or stop when the view is stationary again
        viewStationaryHandle = watchUtils.whenTrue(
          view,
          "stationary",
          clear
        );
      });

    return {
      remove: function() {
        this.remove = function() {};
        clear();
        interactWatcher.remove();
      }
    };
  };

  /**
   * utility method that synchronizes the viewpoints of multiple views
   */
  var synchronizeViews = function(views) {
    var handles = views.map(function(view, idx, views) {
      var others = views.concat();
      others.splice(idx, 1);
      return synchronizeView(view, others);
    });

    return {
      remove: function() {
        this.remove = function() {};
        handles.forEach(function(h) {
          h.remove();
        });
        handles = null;
      }
    };
  };

  // bind the views
  synchronizeViews([view, view2, view3]);


})

/************************************************************
 * Create DataTable instance
 ************************************************************/
$(document).ready(function() {
  var table = $('#n2k_table_placeholder').DataTable({
    "ajax": 'data/data.json',
    "scrollX": true,
    "scrollY": "300px",
    "scrollCollapse": true,
    "paging": false
  });
  
  $(window).resize(function() {
    var width = $('#mapcontainer1').width();
    if($(window).width() > 1200){        
        $("map").height(width);
    } else {
        $("map").height(width*0.55);
    }
  })
    
  
});


