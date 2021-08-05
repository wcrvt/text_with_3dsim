class webglGraph{
  constructor(containerID, suffix) {
    this.suffix=suffix;
    this.containerID=containerID;
    this.container=document.getElementById(this.containerID);

    this.elemCanvas=document.createElement('canvas');
    this.elemCanvas.id="graph-"+suffix;
    this.container.appendChild(this.elemCanvas);
    this.canvas=document.getElementById(this.elemCanvas.id);

    this.options={ graphs:2, samples:200, canvasWidth:800, canvasHeight:200, },

    this.canvas.width=this.options.canvasWidth;
    this.canvas.height=this.options.canvasHeight;
    this.gl=this.canvas.getContext('webgl2');

    this.plotStatus={cnt:0,};
    this.data=[];
    this.response=[];
    this.data_x=[];
    this.data_y=[];
  }

  initShaders(){
    let v=document.getElementById("vs").textContent;
    let f=document.getElementById("fs").textContent;
    let p=webgl.createProgram(this.gl, v, f);
    this.bufferLocation=this.gl.getAttribLocation(p, "position");
  }

  initGraph(){
    this.plotStatus.cnt=0;
    this.bufferLocation=0;
    this.data=[];
    this.response=[];
    this.data_x=new Array(this.options.samples).fill(0);
    this.data_y=new Array(this.options.samples).fill(0);
    for(let i=0; i<this.options.samples; i++){
      this.data[3*i+0]=0.99*(2.0*i/this.options.samples-1.0);
      this.data[3*i+2]=0;
      this.response[3*i+0]=0.99*(2.0*i/this.options.samples-1.0);
      this.response[3*i+2]=0;
    };
  }

  init(){
    this.initGraph();
    this.initShaders();
  }

  draw(sampledData1, sampledData2) {
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    if(this.plotStatus.cnt<this.options.samples){
      this.data_x[this.plotStatus.cnt]=sampledData1;
      this.data_y[this.plotStatus.cnt]=sampledData2;
      this.data[3*this.plotStatus.cnt+1]=this.data_x[this.plotStatus.cnt];
      this.response[3*this.plotStatus.cnt+1]=this.data_y[this.plotStatus.cnt];
      this.plotStatus.cnt++;
    }else{
      this.data_x.shift();
      this.data_x.push(sampledData1);
      this.data_y.shift();
      this.data_y.push(sampledData2);
      for(let i=0; i<this.options.samples; i++){
        this.data[3*i+1]=this.data_x[i];
        this.response[3*i+1]=this.data_y[i];
      }
    }

    let pData=this.data.concat(this.response);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer());
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(pData), this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(this.bufferLocation, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.bufferLocation);
    this.gl.drawArrays(this.gl.LINES, 0, this.options.samples*this.options.graphs);
    this.gl.drawArrays(this.gl.POINTS, 0, this.options.samples*this.options.graphs);
    this.gl.flush();
  }
}
