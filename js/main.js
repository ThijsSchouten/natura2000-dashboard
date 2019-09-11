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

  const HTDropdownDiv = document.getElementById('ht-dd')
  popDropDown(HTDropdownDiv, htdict['*'])
  const n2kDropdownDiv = document.getElementById('n2k-dd')

    /*
  for (var key in test_data){
    let option = document.createElement('option');
    option.value = "NAAM_N2k = '" + key + "'"
    let n2k = document.createTextNode(key);
    option.append(n2k)
    n2kDropdownDiv.appendChild(option)
  }*/

  
  /* Populate de dropdown*/
  pzh_n2k.forEach(function(info) {
    let option = document.createElement('option');
    option.value = "NAAM_N2k = '" + info + "'"
    let n2k = document.createTextNode(info);
    option.append(n2k)
    n2kDropdownDiv.appendChild(option)
  });
  

  // Voeg eventlisteners toe 
  // Als een natura2000 gebied wordt gekozen, verander dan de filter,
  // zoom naar de layer, en populate de dropdown met de aanwezig HT/LG
  n2kDropdownDiv.addEventListener('change', function(event) {
    let val = event.target.value
    let txt = event.target.options[n2kDropdownDiv.selectedIndex].text
    setFeatureLayerViewFilter(natura2000, val);
    zoomToFeature(natura2000, val, view);
    popDropDown(HTDropdownDiv, htdict[txt]);
  });
  
  HTDropdownDiv.addEventListener('change', function(event) {
    console.log(event.target.value)
    setFeatureLayerViewFilter(htkaart, event.target.value);
  })  
  
  

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

    /* Layer lijst
    var layerList = new LayerList({
      view: thisview
    });
    thisview.ui.add(layerList, "top-right");
    */
  })
  
    view.ui.add(HTDropdownDiv, {
    position: "top-right"
  });

    



  /************************************************************
   * FeatureLayers
   ************************************************************/

  let htkaart = new FeatureLayer({
    url: "https://services.arcgis.com/170JHtnttvl7hYmM/arcgis/rest/services/Natura2000/FeatureServer/1",
    outfields: ["*"],
    popupTemplate: {
      title: "{n2k_naam}",
      content: "Habitattype: {habitattype}<br/>Kwaliteit: {kwaliteit}"
    }
  });

  let lgkaart = new FeatureLayer({
    url: "https://services.arcgis.com/170JHtnttvl7hYmM/arcgis/rest/services/Natura2000/FeatureServer/2",
    outfields: ["*"],
    popupTemplate: {
      title: "{n2k_naam}",
      content: "Leefgebied: {habitattype}<br/>Kwaliteit: {kwaliteit}"
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
  map1.add(htkaart);
  map2.add(lgkaart);
  map3.add(natura2000);
  
  uniqueValues({
    layer: htkaart,
    field: "habitattype"
  }).then(function(response){
    // prints each unique value and the count of features containing that value
    var infos = response.uniqueValueInfos;
    infos.forEach(function(info){
      console.log(info.value)
      console.log("CANDIDATE: ", info.value, " # OF CAMPAIGN STOPS: ", info.count);
    });    
  })




  /************************************************************
   * Helper Functies
   ************************************************************/

  function zoomToFeature(featurelayer, expression, view) {
    let query = featurelayer.createQuery();
    query.where = expression;
    featurelayer.queryFeatures(query).then((response) => {

      console.log(response.features[0].geometry)
      view.goTo(response.features[0].geometry)
    })
  }

  function setFeatureLayerViewFilter(featureLayer, expression) {
    view.whenLayerView(featureLayer).then(function(featureLayerView) {
          featureLayerView.filter = {
            where: expression
          };
        });
    
    /*view.whenLayerView(featurelayer)
      .then((layerView) => {
        layerView.effect = {
          filter: {
            where: expression
          },
          excludedEffect: "opacity(20%)"
        }
      })*/
  };
  
  function popDropDown(element, items) {  
    // Leeg de Div eerst.
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    
    let option = document.createElement('option')
    option.value = "1 = 1";
    option.append(document.createTextNode('Alle habitattypen'))
    element.appendChild(option)
    
    // 'Populate 
    items.forEach(function(item) {
      let option = document.createElement('option')
      option.value = "habitattype = '" + item + "'";
      option.append(document.createTextNode(item))
      element.appendChild(option)
    });
    
    
    
  }
  

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