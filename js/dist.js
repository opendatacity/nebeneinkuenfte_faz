(function(){var t,e,n,i,r,a,o,s,u,l,c,h,d;window.dictionary={direkt:"Direktmandat",liste:"Listenmandat",Nebentaetigkeit0:"keine Nebentätigkeiten",Nebentaetigkeit:"Nebentätigkeit",Nebentaetigkeit1:"eine Nebentätigkeit",NebentaetigkeitPlural:"Nebentätigkeiten","Bündnis 90/Die Grünen":"Grüne","Die Linke":"Linke"},s={width:800,height:400,center:{x:400,y:400}},t={innerR:100,outerR:400,phiMax:180},i={r:5,spacing:12},e=[{name:"Die Linke","class":"linke"},{name:"SPD","class":"spd"},{name:"Bündnis 90/Die Grünen","class":"gruene"},{name:"FDP","class":"fdp"},{name:"CDU/CSU","class":"cducsu"}],a=function(t){return dictionary[t]?dictionary[t]:t},o=function(t,e){return dictionary[e+t]?dictionary[e+t]:1!==t&&dictionary[e+"Plural"]?t+" "+dictionary[e+"Plural"]:dictionary[e]?t+" "+dictionary[e]:t+" "+e},n=[.01,1e3,3500,7e3,15e3,3e4,5e4,75e3,1e5,15e4,25e4],c=function(t){var e;return 0===t.nebeneinkuenfte.length?0:(e=t.nebeneinkuenfte.reduce(function(t,e){return t+=n[e.level]},0),Math.max(parseInt(e,10),1))},u=_.memoize(function(t,e){var n,i,r,a,o,s;for(s=e?'<span class="digitGroup">':"",n=e?"</span>":"",r=e?"":" ",i=e?'<span class="euro">€</span>':"€",t=String(Math.floor(t)),o=[];t.length>0;)a=t.substr(-3,3),o.unshift(s+a+n),t=t.substr(0,t.length-3);return o.join(r)+r+i}),d=function(t){var e,n,i;return t.length>1?t.each(function(t,e){return d(e)}):(e=$(t).prop("checked"),"undefined"==typeof e&&(e=!0),n=$(t).attr("value"),$(t).parent("label").toggleClass("active",e),i=$("path[title="+n+"]"),e?i.attr("class","active"):i.attr("class","inactive"),h(t))},h=function(t){var e,n,i,r;return r=$(t).parents("fieldset"),e=r.find(":checkbox"),i=r.find(":checkbox:checked"),n=r.find(".convenienceButtons"),n.toggleClass("allChecked",i.length===e.length),n.toggleClass("someChecked",i.length>0),n.toggleClass("noneChecked",0===i.length)},l=function(t){var e;return t.originalEvent.touches?(e=$(t.target).offset(),{x:e.left,y:e.top}):{x:t.pageX,y:t.pageY}},r=function(){function t(t){this.tooltip=$(t),this.tooltip.find("tbody").on("scroll",this.handleScroll),this.tooltip.find("input.close").on("mouseup touchend",null,{inspector:this},function(t){return t.data.inspector.hide(),t.preventDefault()})}return t.prototype.field=function(t){return this.tooltip.find("."+t)},t.prototype.update=function(t){var i,r,s,l,c,h,d,f,p,m;for(this.rep=t,r=u(t.nebeneinkuenfteMinSum,!0),this.field("name").text(t.name).attr("href",t.url),this.field("faction").text(a(t.fraktion)).attr("class","faction "+_.find(e,{name:t.fraktion})["class"]),this.field("land").text(t.land),this.field("mandate").text(a(t.mandat)),this.field("constituency").text(t.wahlkreis),this.field("minSum").html(r),this.field("count").text(o(t.nebeneinkuenfte.length,"Nebentaetigkeit")),l=this.tooltip.find("table"),c=l.find("tbody"),h=c.find("tr").first().clone(),c.empty(),p=t.nebeneinkuenfte,m=[],d=0,f=p.length;f>d;d++)i=p[d],s=h.clone(),s.addClass("cat"+i.level),s.find(".description").text(i.text),s.find(".minAmount").html(u(n[i.level],!0)),m.push(c.append(s));return m},t.prototype.handleScroll=function(t){var e,n,i,r,a,o,s;return o=$(t.target?t.target:t),a=o.scrollTop(),i=o.prop("scrollHeight"),n=o.height(),r=i-a-n,s=Math.max(0,.5*Math.min(a,15)),e=Math.max(0,.5*Math.min(r,15)),o.siblings("thead").css("-webkit-box-shadow","0 "+s+"px .5em -.5em rgba(0, 0, 0, .3)"),o.siblings("tfoot").css("-webkit-box-shadow","0 -"+e+"px .5em -.5em rgba(0, 0, 0, .3)")},t.prototype.measure=function(){var t;return t=this.tooltip.clone(),t.addClass("clone"),t.removeAttr("id style"),t.insertAfter(this.tooltip),this.width=t.outerWidth()+1,this.height=t.outerHeight(!0),t.remove()},t.prototype.show=function(t){return this.measure(),t&&this.moveTo(t),this.tooltip.addClass("visible").removeClass("hidden"),this.visible=!0,this.fixed?this.unfix():void 0},t.prototype.hide=function(){return this.tooltip.addClass("hidden").removeClass("visible"),this.visible=!1,this.unfix()},t.prototype.moveTo=function(t){var e,n,i;return this.position=t,e=parseInt(this.tooltip.css("marginTop"),10),n=this.position.x,i=this.position.y,n+this.width>windowSize.width&&(n=Math.max(0,windowSize.width-this.width)),i+this.height>windowSize.height&&(i=Math.max(0-e,windowSize.height-this.height)),this.tooltip.css({top:i,left:n})},t.prototype.unfix=function(){return this.fixed=!1,this.tooltip.addClass("moving").removeClass("fixed"),$("body").removeClass("inspectorFixed"),this.measure(),this.moveTo(this.position)},t.prototype.fix=function(){var t;return this.fixed=!0,this.tooltip.addClass("fixed").removeClass("moving"),$("body").addClass("inspectorFixed"),t=this.tooltip.find("tbody"),t.scrollTop(0),t.css({maxHeight:Math.min(300,$(window).height()-170)}),this.handleScroll(t),this.measure(),this.moveTo(this.position)},t}(),$(document).ready(function(){var t,e,n,i,r;return $(".startCollapsed").each(function(t,e){return $(e).css({height:$(e).height()}).addClass("collapsed").removeClass("startCollapsed")}),$("#map").on("mouseenter touchstart","path",function(){var t;return t=$(this),t.insertAfter(t.siblings().last())}),$("#map").on("mouseleave touchend","path",function(){var t,e;return t=$(this),e=t.attr("class"),"active"===e?t.insertAfter(t.siblings().last()):t.insertBefore(t.siblings().first())}),e=!1,n=null,$("#map").on("touchstart","path",function(t){var i;return e=!1,i=$(this),n=setTimeout(function(){return e=!0,i.trigger("touchend")},500)}),$("#map").on("dblclick","path",function(){var t;return t=$(this).parents("fieldset").find(":checkbox"),t.prop("checked",!0),d(t),$(this).parents("form").submit()}),i=0,r=null,t=!1,$("#map").on("mouseup touchend","path",function(a){var o,s,u,l,c;return i++,clearTimeout(n),clearTimeout(r),r=setTimeout(function(){return i=0},3e4),a.preventDefault(),t?t=!1:(e&&(t=!0),c=a.shiftKey||a.metaKey||a.ctrlKey||e,l=$(this).attr("title"),s=$(this).parents("fieldset"),c||s.find(":checkbox").prop("checked",!1),o=s.find("input[value="+l+"]"),o.click(),d($(":checkbox")),u=s.find(".uiHint"),2!==i||c?i>2&&c?u.addClass("collapsed"):void 0:(Modernizr.touch&&u.text("Durch langes Tippen können Sie mehrere Länder auswählen."),u.removeClass("collapsed"),setTimeout(function(){return u.addClass("collapsed")},8e3)))}),d($(":checkbox")),$(".invertSelection, .selectAll").click(function(t){var e,n,i;return n=$(this).parents("fieldset"),i=":checkbox",$(this).hasClass("selectAll")&&(i+=":not(:checked)"),e=n.find(i),e.each(function(t,e){return $(e).prop("checked",!$(e).prop("checked")),d(e)}),$(this).parents("form").triggerHandler("submit")})}),$.getJSON(window.dataPath,function(n){var i,a,o,u,h,f,p,m,g,v,w,x,y,b,k,C,M,S,D,A,z,T,P,B;return n=n.data,window._data=_(n),h=e.filter(function(t){return _data.find({fraktion:t.name})}),_data.each(function(t){return t.nebeneinkuenfteMinSum=c(t),t.nebeneinkuenfte.sort(function(t,e){return e.level-t.level})}),o=_data.groupBy("fraktion").value(),D=_.mapValues(o,function(t){return t.length}),B=_.reduce(D,function(t,e){return t+e}),w=_.mapValues(o,function(t,e){var n,i;return i=_.reduce(t,function(t,e){return t+e.nebeneinkuenfteMinSum},0),n=D[e],i/n}),S=900/_.max(w),M=function(t){return S*Math.sqrt(t.nebeneinkuenfteMinSum)},_data.each(function(t){return t.radius=M(t)}),n=_data.where(function(t){return t.nebeneinkuenfteMinSum>1}).value(),console.log(n),o=_.groupBy(n,"fraktion"),C=null,k=1,P=0,T=function(e){var i,r,o;return null===C&&(C=new Date),i=e.alpha*e.alpha,r=d3.geom.quadtree(n),n.forEach(function(e,n){var i,o,u,l,c,h,d,f,p,m,g,v;return i=e.x-s.center.x,o=e.y-s.center.y,v=Math.sqrt(i*i+o*o),m=Math.atan2(i,-o),g=Math.atan2(e.radius,v),h=_.find(A,function(t){return t.data.faction===e.fraktion}),f=h.startAngle,d=h.endAngle,v<t.innerR+e.radius&&(p=(t.innerR+e.radius-v)/v,e.x+=i*p,e.y+=o*p),e.phi=m,e.wrongPlacement=!1,f+g>m&&(u=f+g,e.wrongPlacement=!0),m>d-g&&(u=d-g,e.wrongPlacement=!0),u&&(v=Math.max(t.innerR+e.radius,v),o=-v*Math.cos(u),i=v*Math.sin(u),l=s.center.x+i,c=s.center.y+o,e.x=l,e.y=c),a(.3,r)(e)}),(P%k===0||.001>i)&&(x.attr("cx",function(t){return t.x}),x.attr("cy",function(t){return t.y})),P++,5===P?(o=(new Date-C)/5,k=Math.ceil(o/40)):void 0},a=function(t,e){return function(n){var i,r,a,o,s;return s=3*n.radius,i=n.x-s,r=n.x+s,a=n.y-s,o=n.y+s,e.visit(function(e,u,l,c,h){var d,f,p,m;return e.point&&e.point!==n&&e.point.fraktion===n.fraktion&&(m=n.x-e.point.x,f=n.y-e.point.y,p=Math.sqrt(m*m+f*f),s=n.radius+e.point.radius+1,s>p&&(d=(p-s)/p*t,n.x-=m*=d,n.y-=f*=d,e.point.x+=m,e.point.y+=f)),u>r||i>c||l>o||a>h})}},z=d3.select("#parliament").attr("width",s.width).attr("height",s.height+10).attr("viewBox","0 0 "+s.width+" "+s.height),b=d3.layout.pie().sort(null).value(function(t){return t.seats}).startAngle(Math.PI*-.5).endAngle(.5*Math.PI),A=b(_.map(h,function(t){return{faction:t.name,seats:D[t.name]}})),g=function(){var t,e,n,i,r,a,u,l;for(l=[],a=0,u=A.length;u>a;a++)e=A[a],n=e.data.faction,i=o[n].length,t=e.endAngle-e.startAngle,r=s.height,l.push(_(o[n]).sortBy("nebeneinkuenfteMinSum").each(function(n,i){return i=2*(i%5)+1,1===i&&(r+=2.5*n.radius),n.initialX=s.center.x+r*Math.sin(e.startAngle+t*i*.1),n.initialY=s.center.y-r*Math.cos(e.startAngle+t*i*.1)}));return l},y=z.append("g").attr("width",s.width).attr("height",s.height).attr("transform","translate("+s.center.x+", "+s.center.y+")"),m=y.selectAll(".faction").data(A).enter().append("g").attr("class",function(t){return"arc "+_.find(h,{name:t.data.faction})["class"]}),i=d3.svg.arc().outerRadius(t.outerR).innerRadius(t.innerR),m.append("path").attr("d",i),p=d3.layout.force().nodes(n).size([s.width,2*s.height]).gravity(.1).charge(function(t){return-2*t.radius-1}).chargeDistance(function(t){return 3*t.radius}).friction(.9).on("tick",T),x=null,g(),u=function(t){return x=z.selectAll("circle").data(n),x.enter().append("circle").attr("class",function(t){return _.find(h,{name:t.fraktion})["class"]}).attr("data-name",function(t){return t.name}).attr("cx",function(t){return t.x=t.initialX}).attr("cy",function(t){return t.y=t.initialY}),x.transition().attr("r",function(t){return t.radius}).style("opacity",function(t){return t.radius<1?0:1}),x.exit().remove(),t&&p.start(),p.alpha(.07)},f=function(t){return _(n).each(function(e){var n;return n=_.reduce(t,function(t,n,i){var r;return r=_.contains(n,e[i]),Boolean(t*r)},!0),n?(e.radius=M(e),e.previouslyVisible||(e.x=e.initialX),e.previouslyVisible||(e.y=e.initialY)):e.radius=.01,e.previouslyVisible=n,null})},f({}),u(!0),v=new r("#repInspector"),$("form").on("submit",function(t){var e,n,i;return $(this).data("suspendSumbit")?(t.preventDefault(),!1):(n=$(this),i=n.find("input[type=hidden], :checkbox:checked"),t.preventDefault(),e=_(i.get()).groupBy("name").mapValues(function(t){return t.map(function(t){return $(t).val()})}).value(),f(e),u())}),$("form").on("change","input",function(){return $(this).submit(),d(this)}),$("svg").on("mousemove touchend","circle",function(t){var e,n;return t.preventDefault(),e=l(t),n=d3.select(this).datum(),v.visible||(v.update(n),v.show(e)),v.fixed?void 0:v.moveTo(e)}),$("svg").on("mouseleave","circle",function(){return v.fixed?void 0:v.hide()}),$(document).on("mouseup",function(t){return v.fixed&&$(t.target).parents(".repInspector").length<1?v.hide():void 0}),$("svg").on("mouseup touchend","circle",function(t){var e,n;return e=l(t),n=d3.select(this).datum(),v.fixed&&d3.select(this).datum()===v.rep?(v.unfix(),v.moveTo(e)):v.fixed?(v.update(n),v.show(e)):(t.stopPropagation(),v.fix())}),$("form").on("touchstart",function(t){return $(this).addClass("fullScreen"),t.stopPropagation()}),$("form").on("touchend",".close",function(t){return $(this).parents("form").removeClass("fullScreen")}),$(".toggler").on("mouseup touchend",function(t){return $(this.getAttribute("href")).toggleClass("hidden")}),$(".toggler").click(function(t){return t.preventDefault()}),$(window).on("resize",function(t){var e,n,i,r,a,o;return window.windowSize={width:$(window).width(),height:$(window).height()},o=Math.min(1,(windowSize.width-16)/s.width),n=Math.min(1,(windowSize.height-16)/(s.height+10)),r=Math.min(o,n),$("#parliament, #parliamentContainer").height((s.height+10)*r).width(s.width*r),e=$("body"),a=windowSize.height-26-s.height*r,i=windowSize.width-16-s.width*r,300>a||500>a&&Modernizr.touch?e.removeClass("tall").addClass("short"):e.addClass("tall").removeClass("short"),i>220?e.addClass("wide").removeClass("narrow"):e.removeClass("wide").addClass("narrow")}),$("label, a").on("touchend",function(t){return t.preventDefault(),$(this).trigger("click")}),$("svg").on("touchend",function(t){return t.preventDefault()}),$(window).trigger("resize")})}).call(this);