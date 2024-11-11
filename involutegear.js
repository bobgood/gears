class Gear {
    constructor(module, numTeeth, pressureAngle) {
		console.log(module, numTeeth, pressureAngle);
        this.Module = module;
        this.NumTeeth = numTeeth;
        this.PressureAngle = pressureAngle;
        this.Outline = [];
        this.Inline = [];
        this.Teeth = [];
        this.scene = new THREE.Scene();


		// Rp aka r pitch
		this.Rpitch = this.pitch_diameter()/2.0;

		// Rb aka r base
		this.Rbase = this.base_diameter()/2.0;

		// Rd aka r dedendum aka r min
		this.Rdedendum = this.Rpitch - this.dedendum();

		// Ra aka r addendum aka r max
		this.Raddendum = this.Rpitch + this.addendum();

		// thickness of the tooth
		this.Ttooth  = this.tooth_thickness();

		// smoothing points along the involute curve
		this.Smoothing = 20;

		this.Base_involute_curve = this.involute_curve();

		this.generate();
		console.log(this.Outline);
    }

	point_radius( pnt ){
		return Math.sqrt( pnt.x*pnt.x + pnt.y*pnt.y );
	}

	lerp( val, v0, p0, v1, p1 ){
		var w = (val - v0)/(v1-v0);
		return {
			x:p1.x*w+p0.x*(1.0-w), 
			y:p1.y*w+p0.y*(1.0-w)
		};
	}

	rotate_point( cen, pnt, theta ){
		var tpnt = {
			x: pnt.x-cen.x, 
			y:pnt.y-cen.y 
		};
		var rpnt = {
			x:Math.cos(theta)*tpnt.x + Math.sin(theta)*tpnt.y, 
			y:-Math.sin(theta)*tpnt.x+Math.cos(theta)*tpnt.y };
		return {x: rpnt.x+cen.x, y: rpnt.y+cen.y };
	}

	involute_point(theta) {
		return {
			x: this.Rbase * (Math.cos(theta) + theta * Math.sin(theta)),
			y: -this.Rbase * (Math.sin(theta) - theta * Math.cos(theta))
		};
	}

	involute_bisect(  r_target ){
		var theta_lo = 0.0;
		var r_lo = this.point_radius( this.involute_point(theta_lo ) );
		var theta_hi = Math.PI;
		var r_hi = this.point_radius( this.involute_point(theta_hi ) );
		// check if the target is achievable
		if( this.Raddendum < r_target ) 
			return -1.0;

		var theta_mi = (theta_lo+theta_hi)/2.0;
		var r_mi;
		for(let i=0; i<20; i++ ){
			theta_mi = (theta_lo+theta_hi)/2.0;
			r_mi = this.point_radius( this.involute_point(theta_mi ) );
			if( r_mi <= r_target ){
				r_lo     = r_mi;
				theta_lo = theta_mi;
			} else {
				r_hi     = r_mi;
				theta_hi = theta_mi;
			}
		}
		return theta_mi;
	}

	involute_curve(  ){
		var theta_lo = 0.0;
		var theta_hi = this.involute_bisect(  this.Raddendum );
		var curve = [];
		if( this.Rdedendum < this.Rbase ){
			curve.push( {x: this.Rdedendum, y:0 });
		}
		var dtheta = (theta_hi-theta_lo)/(this.Smoothing-1);
		for( var i=0; i<this.Smoothing; i++ ){
			curve.push( this.involute_point( i*dtheta+theta_lo ));
		}
		return curve;
	}

	pitch_diameter( ){
		console.log(this.Module, this.NumTeeth, this.PressureAngle);
		return this.Module*this.NumTeeth;
	}

	base_diameter( ){
		return this.pitch_diameter()*Math.cos(this.PressureAngle);
	}

	dedendum(){
		return 1.2*this.Module;
	}
	
	addendum(  ){
		return 1.0*this.Module;
	}

	tooth_thickness(  ){
		return Math.PI*this.pitch_diameter()/(2.0*this.NumTeeth);
	}

	generate(){
		// find the crossing point of the involute curve with the pitch circle
		var p_cross = this.involute_point(  this.involute_bisect( this.Rpitch ) );
		var theta_cross = Math.atan2( p_cross.y, p_cross.x );
		var dtheta = this.Ttooth/this.Rpitch;
	

		// compute whether the gear profile will self-intersect once patterned
    	var involute = [];
		let pt;
    	for( var i=0; i<this.Base_involute_curve.length; i++ ){
    		var tpnt = this.rotate_point( {x:0,y:0}, this.Base_involute_curve[i], +theta_cross-dtheta/2 );
    		var angle1 = Math.atan2( tpnt.y, tpnt.x );
    		if( angle1 < Math.PI/this.NumTeeth && tpnt.y > 0 ){
    			involute.push(this.Base_involute_curve[i]);
    		}
    	}



    	for( var i=0; i<this.NumTeeth; i++ ){
      		var theta = i*Math.PI*2.0/(this.NumTeeth)+theta_cross-dtheta/2;
      		var theta2 = i*Math.PI*2.0/(this.NumTeeth)-theta_cross+dtheta/2;
			var tooth=[];

      		for( var j=0; j<involute.length; j++ ){
      			pt = this.rotate_point( {x:0,y:0}, {x:involute[j].x, y:involute[j].y }, theta );
				this.Outline.push(pt);
				tooth.push(pt);
				if (j==0) this.Inline.push(pt);
      		}
      		for( var j=involute.length-1; j>=0; j-- ){
      			pt = this.rotate_point( {x:0,y:0}, {x: involute[j].x, y:-involute[j].y }, theta2 );
				this.Outline.push(pt);
				tooth.push(pt);
				if (j==0) this.Inline.push(pt);
      		}

			this.Teeth.push(tooth);
    	}
	}
};
