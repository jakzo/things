
/*
 * STATISTIC
 */

var Statistic = {
    
    //Whether the statistics analysis is enabled or not
    enabled: true,
    
    //The DOM element that displays the results of the statistics
    element: null,
    
    //Whether the DOM element is displayed on the page or not
    visible: false,
    
    //Stores the data associated with each statistic
    data: {
        //The 'frames per second' statistic is built in
        fps: { id: null, time: 0, average: 0 }
    },
    
    //The amount of sample data to base the result for a statistic on
    dataBufferLength: 100,
    
    //Starts the timer for a specified statistic
    start: function (id) {
        var time = new Date().getTime();
        var data = Statistic.data;
        var fps = data.fps;
        if (data[id]) {
            data[id].start = time;
            if (fps.id == id) {
                fps.average = Math.round(1000 / (time - fps.time));
                fps.time = time;
            }
        }
        else {
            if (!fps.id) { fps.id = id; fps.time = time; }
            data[id] = { scores: [], average: 0, current: 0, start: time };
        }
    },
    
    //Ends the timer for a specified statistic
    end: function (id) {
        var data = Statistic.data[id];
        var scores = data.scores;
        scores[data.current] = new Date().getTime() - data.start;
        var total = 0;
        for (var i = 0, length = scores.length; i < length; i++)
            total += scores[i];
        data.average = total / length;
        if (++data.current >= Statistic.dataBufferLength) data.current = 0;
    },
    
    //Renders the results of the statistics in the DOM element
    update: function (){
        var html = [];
        for(var statistic in Statistic.data) {
            var result = Statistic.data[statistic].average;
            if(statistic == "fps") html.push("FPS: " + result);
            else html.push(statistic + ": " + result.toFixed(2) + "ms");
        }
        Statistic.element.innerHTML = html.join("<br />");
    },
    
    //Creates the DOM element containing the results of the statistics
    initialise: function () {
        var stats = Statistic.element = document.createElement('div');
        stats.style.position = "absolute";
        stats.style.top = stats.style.left = "8px";
        stats.style.backgroundColor = "#006";
        stats.style.color = "#FFF";
        stats.style.padding = "4px";
        stats.style.opacity = 0.6;
    },
    
    //Shows the results DOM element
    show: function () {
        if (!Statistic.enabled || Statistic.visible) return;
        document.body.appendChild(Statistic.element);
        Statistic.visible = true;
    },
    
    //Hides the results DOM element
    hide: function () {
        if (!Statistic.enabled || !Statistic.visible) return;
        document.body.removeChild(Statistic.element);
        Statistic.visible = false;
    },
    
    //Toggles the visibility of the results DOM element
    toggle: function () {
        Statistic.visible ? Statistic.hide() : Statistic.show();
    }
    
};