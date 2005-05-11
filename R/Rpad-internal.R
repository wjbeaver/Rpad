.RpadEnv <- new.env()

".onLoad" <-
function(lib, pkg) {
    require(graphics)
    require(utils)
    require(R2HTML)
    # The following uses the environment variable DOCUMENT_ROOT with apache to find
	# the directory of the R process. Change may be required for another server.
	if (Sys.getenv("DOCUMENT_ROOT") != "") { # works for Apache 1.3 linux & win
		RpadDir <- gsub(Sys.getenv("DOCUMENT_ROOT"), "",
                        getwd(),  ignore.case = TRUE) # strip off the document root
	} else if (Sys.getenv("SCRIPT_NAME") != "") { # for Apache 2.0
        RpadDir <- paste(gsub("R_process.pl", "", Sys.getenv("SCRIPT_NAME"), ignore.case = TRUE),
                         gsub(".*/", "", getwd()),
                         sep="")
	} else if (Sys.getenv("PATH_INFO") != "") { # for microsoft IIS
        RpadDir <- paste(gsub("R_process.pl", "", Sys.getenv("PATH_INFO"), ignore.case = TRUE),
                         gsub(".*/", "", getwd()),
                         sep="")
	} else {
		.rootdir = ifelse(.Platform$OS.type == "windows", "E:/misc/www", "/var/www")
		RpadDir <- gsub(.rootdir, "", getwd(),  ignore.case = TRUE)
	}

	options(R.output.format = "text")
	options(R2HTML.sortableDF = TRUE)
	options(R2HTML.format.digits = 3)
	options(R2HTML.format.nsmall = 0)
	options(R2HTML.format.big.mark = "")
	options(R2HTML.format.big.interval = 3)
	options(R2HTML.format.decimal.mark = Sys.localeconv()[["decimal_point"]])

    
# 	.RpadEnv <<- environment()
#    assign(".RpadEnv", environment(), sys.parent())
	assign(".RpadGraphOptions", list(type = "pngalpha", res = 120,
   		width = 0, height = 0, pointsize = 10, sublines = 0,
   		toplines = .6, ratio = 4/3, leftlines = 0, lwd = 0.6),
   		envir = .RpadEnv)
    assign("RpadLocal", FALSE, envir = .RpadEnv)
    assign("RpadDir", RpadDir, envir = .RpadEnv)
    .HTML.file <<- ""
    assign("Rpad.plot.counter",  0, envir = .RpadEnv)
}

".onUnload" <-
function(libpath) {
 	if (interactive()) stopRpadServer()
}

".packageName" <- "Rpad"
