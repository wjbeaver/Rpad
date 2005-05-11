



# Rpad graphing functions 

"fspdf" <- function(file = "Rplot.pdf", width = 4, height = 4, ...) { 
  # fullscreen pdf device - code adapted from the bitmap function
  gsexe <- Sys.getenv("R_GSCMD")
  if (is.null(gsexe) || nchar(gsexe) == 0) gsexe <- "gs"
  res=300;
  cmd <- paste("|", gsexe, " -dNOPAUSE -dBATCH -q -sDEVICE=pdfwrite -dAutoRotatePages=/None -sOutputFile=",
               file, " -r", res, " -g", ceiling(res * width), "x", ceiling(res * height),
               " -c [ /PageMode /FullScreen /DOCVIEW pdfmark -",
               sep = "")
  postscript(file = cmd, paper = "special", width=width, height=height, horizontal = FALSE, ...)
}

"graphoptions" <- function (..., reset = FALSE, override.check = FALSE) 
# modified based on code from ps.options
{
    l... <- length(new <- list(...))
    old <- check.options(new = new, envir = .RpadEnv, name.opt = ".RpadGraphOptions", 
        reset = as.logical(reset), assign.opt = l... > 0, override.check = override.check)
    if (reset || l... > 0) 
        invisible(old)
    else old
}

"newRpadPlotName" <- function(name) {
  # Updates the plot counter and name
  if (name == "") {
	Counter <- get("Rpad.plot.counter", envir = .RpadEnv)
    assign("Rpad.plot.counter", Counter + 1, envir = .RpadEnv)
    name <- paste("Rpad_plot", Counter, sep="")
  } 
  assign("Rpad.plot.name", name, envir = .RpadEnv)
  name
}

"RpadPlotName" <- function()
  get("Rpad.plot.name", envir = .RpadEnv)


 
"closeCurrentDevice" <- function() {
  # Closes the current device and if the current device is postscript,
  # process the output with ghostscript to generate the desired output.
  if (exists("RpadPlotParams", envir = .RpadEnv))
    p <- get("RpadPlotParams", envir = .RpadEnv)
  else
    return()
  dev.set(p$dev)
  if (.Device == "postscript") {
    dev.off()
    if (.Platform$OS.type == "windows") {
      gsexe <- Sys.getenv("R_GSCMD")
      if (is.null(gsexe) || nchar(gsexe) == 0) 
        gsexe <- ifelse(.Platform$OS.type == "windows", "gswin32c.exe", "gs")
        
      gshelp <- system(paste(gsexe, "-help"), intern = TRUE, invisible = TRUE)
      st <- grep("^Available", gshelp)
      en <- grep("^Search", gshelp)
      gsdevs <- gshelp[(st + 1):(en - 1)]
      devs <- c(strsplit(gsdevs, " "), recursive = TRUE)
      if (match(p$type, devs, 0) == 0) 
        stop(paste(paste("Device ", p$type, "is not available"), 
                   "Available devices are", paste(gsdevs, collapse = "\n"), 
                   sep = "\n"))
      tmp <- tempfile("Rbit")
      cmd <- paste(gsexe, " -dNOPAUSE -dBATCH -q -sDEVICE=", p$type, 
                   " -r", p$res, " -g", ceiling(p$res * p$width), "x",
                   ceiling(p$res * p$height), " -sOutputFile=", p$name,
                   "-%03d.png ", p$name, ".eps", sep = "")
      system(cmd, intern = TRUE, invisible = TRUE)
    }
    for (fun in getHook("closeRpadDevice")) try(fun())
  } else if (.Device != "null device") {
    dev.off()
    for (fun in getHook("closeRpadDevice")) try(fun())
  }
  assign("RpadPlotParams", NULL, envir = .RpadEnv)
}

"newDevice" <- function(name, type, res, width, height, pointsize, ...) {
  # Open a new device. If it's a ghostscript-based device, set up the
  # ghostscript handling.
    
  name <- newRpadPlotName(name)
  assign("Rpad.plot.type", type, envir = .RpadEnv)
  if (type == "Rpng") {
    unlink(grep(paste(name,".*\\.png",sep=""), dir(), value=T))
    png(file = paste(name,"-%03d.png",sep=""), width = width*res, height = height*res)
    assign("RpadPlotParams", list(dev=dev.cur()), envir = .RpadEnv)
  } else {
    unlink(grep(paste(name,".*\\.png",sep=""), dir(), value=T))
    if (.Platform$OS.type == "windows") {
      cmd <- NULL
    } else {
      gsexe <- Sys.getenv("R_GSCMD")
      if (is.null(gsexe) || nchar(gsexe) == 0) 
        gsexe <- ifelse(.Platform$OS.type == "windows", "gswin32c.exe", "gs")
      gshelp <- system(paste(gsexe, "-help"), intern = TRUE)
      st <- grep("^Available", gshelp)
      en <- grep("^Search", gshelp)
      gsdevs <- gshelp[(st + 1):(en - 1)]
      devs <- c(strsplit(gsdevs, " "), recursive = TRUE)
      if (match(type, devs, 0) == 0) 
          stop(paste(paste("Device ", type, "is not available"), 
              "Available devices are", paste(gsdevs, collapse = "\n"), 
              sep = "\n"))
      tmp <- tempfile("Rbit")
      cmd <- paste(gsexe, " -dNOPAUSE -dBATCH -q -sDEVICE=", type, 
          " -r", res, " -g", ceiling(res * width), "x", ceiling(res * 
              height), " -sOutputFile=", name, "-%03d.png ", sep = "")
    }
    postscript(file = paste(name,".eps",sep=""), width = width, height = height,
               pointsize = pointsize, 
               paper = "special", horizontal = FALSE, print.it = !is.null(cmd), 
               command = cmd, ...)
    assign("RpadPlotParams", list(dev=dev.cur(), name=name, type=type, width=width, height=height, res=res), envir = .RpadEnv)
  }
}

"newgraph" <- function(name = "", type = graphoptions()$type, res = graphoptions()$res,
                     width = graphoptions()$width, height = graphoptions()$height,
                     pointsize=graphoptions()$pointsize, sublines = graphoptions()$sublines,
                     toplines = graphoptions()$toplines, ratio = graphoptions()$ratio,
                     leftlines = graphoptions()$leftlines, lwd = graphoptions()$lwd, ...) {
# Start a new Rpad graph.
# uses code from bitmap and from Frank Harrell's Hmisc routine setps
  
  if (width == 0 & height == 0) 
    width <- 3.5
  if (width > 0 & height == 0) 
    height <- width/ratio
  if (width == 0 & height > 0) 
    width <- height * ratio
  closeCurrentDevice()
  newDevice(name, type, res, width, height, pointsize, ...)

  par(lwd = lwd, mgp = c(2.5, 0.6, 0),
      mar = c(3 + sublines + 0.25 * (sublines > 0) + 
        0.5, 3 + leftlines + 0.5, toplines+.4,  1) + 0.1,
      cex.main=1,font.main=1,las=1)
  #require(lattice)

#  lattice::lset(lattice::canonical.theme("postscript", color = TRUE))

#  if (exists('xyplot')) {
#    trellis.device(col=T)
#    lset(list(axis.line=list(col="gray50"),axis.text=list(col="black"),
#              strip.background=list(col="white"),strip.shingle=list(col="gray70")))
#  }
  for (fun in getHook("newgraph")) try(fun())
  invisible()
}

"showgraph" <- function(name = RpadPlotName(), link = FALSE, ...) {
# Start a new Rpad graph, and show the existing graph(s).
  name
  newgraph()
  for (n in dir(pattern = paste(name, "-.*png", sep=""))) 
    print(HTMLimg(n))
  if (link && get("Rpad.plot.type", envir = .RpadEnv) != "Rpng")
    cat("<span contentEditable='false'>",
        "<sub><a href='", RpadURL(name), ".eps'>[EPS]</a></sub>",
        "</span>\n",
        sep="")
  invisible()
}


# Here's an example hook that you could use to add an EPS preview to eps files (requires epstool)

#eps.add.preview <- function(fname) system(paste("epstool -n1 -b -t6p -zbmp256 -r200 -g\"gswin32c\" -o",fname,".eps ",fname,".eps",sep=""),show.output.on.console = TRUE)
#
#setHook("closeRpadDevice", function() { # add a tiff preview to an eps file
#  name = RpadPlotName()
#  if (length(dir(pattern=paste(name,".eps",sep=""))) == 1)
#    eps.add.preview(name)
#})
