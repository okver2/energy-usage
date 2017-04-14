var energy_data = [...];
var base_ts = 1373919386367;
var week = 0;
var totals = {days:[], week:0};
var display_mode = 0, display_modes = [{label: 'units', prefix: ''}, {label: '', prefix: '£'}, {label: 'kgs CO2', prefix: ''}];
var week_data;
var unit_cost = 0.137 
unit_co2 = 0.450;

week_data = energy_data.slice(week*7*24,(week+1)*7*24);
totals = calculate_totals(week_data);

var g = d3.select("svg").append("g").attr("id", "chart");

initial_rad = 100;
rad_offset = 25;
ir = function(d, i) {return initial_rad+Math.floor(i/24)*rad_offset;}
or = function(d, i) {return initial_rad+rad_offset+Math.floor(i/24)*rad_offset;}
sa = function(d, i) {return (i*2*Math.PI)/24;}
ea = function(d, i) {return ((i+1)*2*Math.PI)/24;}

//Draw the chart
var color = d3.scale.linear().domain([0.04, 1]).range(["white", "red"]);
d3.select('#chart').selectAll('path').data(week_data)
	.enter().append('svg:path')
	.attr('d', d3.svg.arc().innerRadius(ir).outerRadius(or).startAngle(sa).endAngle(ea))
	.attr('transform', 'translate(300, 300)')
  	.attr('fill', color)
	.attr("stroke", "gray")
	.attr("stroke-width", "0.3px")
	.on('mouseover', render_hour_info)
	.on('mouseout', reset_hour_info);

//Labels
var day_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
var label_rad = 106;
for(var i=0; i<7; i++) {
	label = day_labels[i];
	label_angle = 4.73;
	d3.select("svg").append("def")
	  .append("path")
	  .attr("id", "day_path"+i)
	  .attr("d", "M300 300 m"+label_rad*Math.cos(label_angle)+" "+label_rad*Math.sin(label_angle)+" A"+label_rad+" "+label_rad+" 90 0 1 "+(300+label_rad)+" 300");
	d3.select("svg").append("text")
	  .attr("class", "day label")
	  .append("textPath")
	  .attr("xlink:href", "#day_path"+i)
	  .text(label);
	label_rad += rad_offset;
}

label_rad = 280;
d3.select("svg").append("def")
	.append("path")
	.attr("id", "time_path")
	.attr("d", "M300 "+(300-label_rad)+" a"+label_rad+" "+label_rad+" 0 1 1 -1 0");
for(var i=0; i<24; i++) {
	label_angle = (i-6)*(2*Math.PI/24);
	large_arc = i<6 || i> 18? 0 : 1;
	d3.select("svg").append("text")
		.attr("class", "time label")
		.append("textPath")
		.attr("xlink:href", "#time_path")
		.attr("startOffset", i*100/24+"%")
		.text(convert_to_ampm(i));
}

reset_hour_info();

//Define events
d3.selectAll("#status").on('click', function() {
	display_mode = (display_mode+1)%3;
	reset_hour_info();
});

d3.select('#upweek').on('click', function() {
	if(week>=25) return;
	week++;
	week_data = energy_data.slice(week*7*24,(week+1)*7*24);
	d3.select('#chart').selectAll('path').data(week_data).attr('fill', color);
	totals = calculate_totals(week_data);
	reset_hour_info();
})

d3.select('#downweek').on('click', function() {
	if(week<=0) return;
	week--;
	week_data = energy_data.slice(week*7*24,(week+1)*7*24);
	d3.select('#chart').selectAll('path').data(week_data).attr('fill', color);
	totals = calculate_totals(week_data);
	reset_hour_info();
})



function render_hour_info(d, i) {
	var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	var day = Math.floor(i/24); //day index
	var h = i%24; //hour index
	var kwh = new Number(d);
	var day_kwh = new Number(totals.days[day]);
	var dm = display_modes[display_mode];

	//Update times
	d3.select('#status g.first text.time').text(days[day]);
	d3.select('#status g.second text.time').text(convert_to_ampm(h)+' - '+convert_to_ampm(parseInt(h)+1));
	d3.select('#status g.third text.time').text('Projection');

	//Update value
	switch(display_mode) {
	  case 0:
	    d3.select('#status g.first text.value').text(dm.prefix+day_kwh.toFixed(1));
	    d3.select('#status g.second text.value').text(dm.prefix+kwh.toFixed(1));
	    d3.select('#status g.third text.value').text(dm.prefix+(day_kwh*365).toFixed(0));
	    break;
	  case 1:
	    d3.select('#status g.first text.value').text(dm.prefix+(unit_cost*day_kwh).toFixed(2));
	    d3.select('#status g.second text.value').text(dm.prefix+(unit_cost*kwh).toFixed(2));
	    d3.select('#status g.third text.value').text(dm.prefix+(unit_cost*day_kwh*365).toFixed(0));
	    break;
	  case 2:
	    d3.select('#status g.first text.value').text(dm.prefix+(unit_co2*day_kwh).toFixed(1));
	    d3.select('#status g.second text.value').text(dm.prefix+(unit_co2*kwh).toFixed(1));
	    d3.select('#status g.third text.value').text(dm.prefix+(unit_co2*day_kwh*365).toFixed(0));
	    break;
	}

	//Update units
	d3.select('#status g.first text.units').text(dm.label);
	d3.select('#status g.second text.units').text(dm.label);
	d3.select('#status g.third text.units').text(dm.label+'/yr');
  }

function reset_hour_info() {
	var dm = display_modes[display_mode];
	week_kwh = new Number(totals.week);

	d3.select('#status g.first text.time').text(ts_to_datestring(base_ts, 7*week) + ' - ' + ts_to_datestring(base_ts, 7*week+6));
	d3.select('#status g.second text.time').text('');
	d3.select('#status g.third text.time').text('Projection');

	switch(display_mode) {
	  case 0:
	    d3.select('#status g.first text.value').text(dm.prefix+week_kwh.toFixed(1));
	    d3.select('#status g.second text.value').text('');
	    d3.select('#status g.third text.value').text(dm.prefix+(week_kwh*365/7).toFixed(0));
	    break;
	  case 1:
	    d3.select('#status g.first text.value').text(dm.prefix+(unit_cost*week_kwh).toFixed(2));
	    d3.select('#status g.second text.value').text('');
	    d3.select('#status g.third text.value').text(dm.prefix+(unit_cost*week_kwh*365/7).toFixed(0));
	    break;
	  case 2:
	    d3.select('#status g.first text.value').text(dm.prefix+(unit_co2*week_kwh).toFixed(1));
	    d3.select('#status g.second text.value').text('');
	    d3.select('#status g.third text.value').text(dm.prefix+(unit_co2*week_kwh*365/7).toFixed(0));
	    break;
	}

	d3.select('#status g.first text.units').text(dm.label);
	d3.select('#status g.second text.units').text('');
	d3.select('#status g.third text.units').text(dm.label+'/yr');
}

function ts_to_datestring(ts, day_offset) {
	date = new Date(ts + day_offset * 3600 * 24 * 1000);
	return date.toDateString().slice(4, 10);
}

function calculate_totals(week_data) {
	var totals = {days:[0, 0, 0, 0, 0, 0, 0], week:0};
		for(var d=0; d<7; d++) {
			for(var h=0; h<24; h++)
				totals.days[d]+=week_data[d*24+h];
			totals.week += totals.days[d]
		}
	return totals;
}

function convert_to_ampm(h) {
	if(h=='0' || h=='24')
	  return 'Midnight';
	var suffix = 'am';
	if(h>11) suffix = 'pm';
	if(h>12)
	  return (h-12)+suffix;
	else
	  return h+suffix;
}
