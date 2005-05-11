



# Rpad HTML generation and other utilities

"HTMLon" <- function()
  HTMLtag("htmlon/")

"HTMLoff" <- function()
  HTMLtag("htmloff/")

"ROutputFormat" <- function(Format)
  options(R.output.format = Format)

"HTML.data.frame" <-
function(x, file = .HTML.file, Border = 1, innerBorder = 0, classfirstline = "firstline",
	classfirstcolumn = "firstcolumn", classcellinside = "cellinside",  append = TRUE ,
	align = "center", caption = "", captionalign = "bottom", classcaption = "captiondataframe",
	classtable = "dataframe", digits = getOption("R2HTML.format.digits"),
	nsmall = getOption("R2HTML.format.nsmall"), big.mark = getOption("R2HTML.format.big.mark"),
	big.interval = getOption("R2HTML.format.big.interval"),
	decimal.mark = getOption("R2HTML.format.decimal.mark"), sortableDF = getOption("R2HTML.sortableDF"), ...) {

	# [PhG] This is much too long! Use an options argument with a list of named properties instead!

   	cat("\n", file = file, append = append)

   	if (sortableDF) cat(paste(c("<style>", ".tablesort  {", "cursor: pointer ;", " behavior:url(js/tablesort.htc);", " -moz-binding: url(js/moz-behaviors.xml#tablesort.htc);", "}", "</style>"), collapse = "\n"), file = file, append = TRUE)

  	# if (!is.null(digits)) x[] = lapply(x, FUN = function(vec) if (is.numeric(vec)) round(vec, digits) else vec)

   	txt <- paste("<p align=", align, ">")
   	txtcaption <- ifelse(is.null(caption), "", paste("<caption align=", captionalign, " class=", classcaption, ">", caption, "</caption>", sep = ""))

   	if (!is.null(Border)) {
		txt <- paste(txt, "<table cellspacing=0 border=", Border, ">", txtcaption, "<tr><td>", "<table border=", innerBorder, " class=", classtable, ">", sep = "")
   	} else {
		txt <- paste(txt, "<table border=", innerBorder, " class=", classtable, " cellspacing=0>", txtcaption, sep = "")
	}
	txt <- paste(txt, "\t<TBODY>\n", sep = "\n")

   	if(is.null(dimnames(x)[[2]]) == FALSE) {
      	VecDebut <- c(if(is.null(dimnames(x)[[1]]) == FALSE) paste(
            "<th>", if(sortableDF) '<b class="tablesort">', sep = "", collapse = ""), rep(paste("<th>", if(sortableDF) '<b class="tablesort">', sep = "",collapse = ""), ncol(x) - 1))

      	VecMilieu <- c(if(is.null(dimnames(x)[[1]]) == FALSE) "&nbsp;",
         	as.character(dimnames(x)[[2]]))

      	VecFin <- c(if(is.null(dimnames(x)[[1]]) == FALSE) paste(if(sortableDF) '</b>',"","</th>", collapse = ""), rep(
         	paste(if(sortableDF) '</b>', "", "</th>", collapse = ""), ncol(x) - 1), "</th>")
      	txt <- paste(txt, "<tr class=", classfirstline, ">", paste(VecDebut, VecMilieu, VecFin, sep = "",
         	collapse = ""), "</tr>\n")
   	}
   	#18/10/2004
   	# MODIF suggested by Arne Henningsen that allows using a different decimal separator and so on as
   	# we call format which is very flexible

   	x.formatted <- format(x, digits = digits, nsmall = nsmall, big.mark = big.mark, big.interval = big.interval, decimal.mark = decimal.mark)
   	x.formatted <- as.matrix(x.formatted)
   	x.formatted[is.na(x.formatted)] <- " "
   	x.formatted[is.nan(x.formatted)] <- " "
   	x.formatted[grep("^ *(NA|NaN) *$", x.formatted)] <- " "

   	for(i in 1:dim(x)[1]) {
      	if(i == 1) {
         	VecDebut <- c(if(is.null(dimnames(x)[[1]]) == FALSE) paste(
              	"<tr><td class=", classfirstcolumn, ">", sep = ""),
            	paste("<td class=", classcellinside, ">", sep = ""),
            	rep(paste("<td class=", classcellinside, ">", sep =
            	""), dim(x)[2] - 1))
         	VecMilieu <- c(if(is.null(dimnames(x)[[1]]) == FALSE)
              	dimnames(x)[[1]][i],
              	x.formatted[i,])
         	VecFin <- c(if(is.null(dimnames(x)[[1]]) == FALSE) "</td>",
            	rep("</td>", dim(x)[2] - 1), "</td></tr>\n")
      	} else {
         	VecDebut <- c(if(is.null(dimnames(x)[[1]]) == FALSE) paste(
              	"<tr><td class=", classfirstcolumn, ">", sep = ""),
            	paste(rep(paste("<td class=", classcellinside, ">", sep
             	= ""), dim(x)[2])))
         	VecMilieu <- c(if(is.null(dimnames(x)[[1]]) == FALSE)
              	dimnames(x)[[1]][i],
              	x.formatted[i,])
         	VecFin <- c(if(is.null(dimnames(x)[[1]]) == FALSE) "</td>",
            	rep("</td>", dim(x)[2] - 1), "</td></tr>\n")
      	}
      	txt <- paste(txt, paste(VecDebut, VecMilieu, VecFin, sep = "", collapse = ""))
   	}
   	txt <- paste(txt, "\n\t</TBODY>\n</table>\n", if (!is.null(Border)) "</td></table>\n", "<br>")
   	cat(txt, "\n", file = file, sep = "", append = TRUE)
}


"print.condition" <- function (x, ...) {
	# redefine this to get rid of the <> brackets around error messages

	msg <- conditionMessage(x)
    call <- conditionCall(x)
    cl <- class(x)[1]
    if (!is.null(call)) {
        cat("** ", cl, " in ", deparse(call), ": ", msg, " **\n", sep = "")
    } else {
		cat("** ", cl, ": ", msg, " **\n", sep = "")
	}
}

"HTMLh1" <- function(text) {
  str <- paste("<h1>", text, "</h1>", sep="", collapse="\n")
  class(str) <- "HTMLchunk"
  str
}
"HTMLh2" <- function(text) {
  str <- paste("<h2>", text, "</h2>", sep="", collapse="\n")
  class(str) <- "HTMLchunk"
  str
}
"HTMLh3" <- function(text) {
  str <- paste("<h3>", text, "</h3>", sep="", collapse="\n")
  class(str) <- "HTMLchunk"
  str
}
"HTMLh4" <- function(text) {
  str <- paste("<h4>", text, "</h4>", sep="", collapse="\n")
  class(str) <- "HTMLchunk"
  str
}
"HTMLh5" <- function(text) {
  str <- paste("<h5>", text, "</h5>", sep="", collapse="\n")
  class(str) <- "HTMLchunk"
  str
}  

"print.HTMLchunk" <- function(x, file = "", ...)
  cat(file=file, x, "\n")

"HTMLargs" <- function(...) {
  # returns a string with the arguments as a='arg1', b='arg2', and so on
  others <- list(...)
  names <- names(others)
  if (length(others) > 0) str <- " " else str <- ""
  for (i in seq(along = others))
    str <- paste(str, names(others[i]), "= '", others[[i]], "' ", sep = "")
  class(str) <- "HTMLchunk"
  str
}

"HTMLtag" <- function(tagName, ...) {
  # outputs the given HTML tagName with arguments supplied in ...
  str <- paste("<", tagName, HTMLargs(...), ">", sep = "", collapse = "")
  class(str) <- "HTMLchunk"
  str
}

"HTMLetag" <- function(tagName) {
  str <- paste("</", tagName, ">\n", sep = "")
  class(str) <- "HTMLchunk"
  str
}

"HTMLradio" <- function(variableName, commonName = "radio", text = "", ...) {
  # outputs an HTML radio button wrapped in a contentEditable=false span
  str <- paste("<span contentEditable='false'>",
               "<input",
               HTMLargs(type = 'radio', name = commonName, value = variableName, ...),
               ">", text, "</input>",
               "</span>",
               "\n",
               sep = "", collapse = "")
  class(str) <- "HTMLchunk"
  str
}
"HTMLcheckbox" <- function(name, text = "", ...) {
  str <- paste("<span contentEditable='false'>",
               "<input",
               HTMLargs(type = 'checkbox', name = name, id = name, ...),
               "/><label", HTMLargs("for" = name), ">", text,
               "</label></span>",
               "\n",
               sep = "", collapse = "")
  class(str) <- "HTMLchunk"
  str
}

"HTMLinput" <- function(name, value = "", rpadtype = "Rvariable", contenteditablewrapper = TRUE, ...) {
  str <- paste(
               ifelse(contenteditablewrapper, "<span contentEditable='false'>", ""),
               HTMLtag(tagName = "input", name = name, value = value, "rpad_type" = rpadtype, ...),
               "</input>\n",
               ifelse(contenteditablewrapper, "</span>", "")
               )
  class(str) <- "HTMLchunk"
  str
}

"HTMLselect" <- function(name, text, default=1, size=1, id=name, contenteditablewrapper=TRUE,
                       optionvalue=text, ...) {
  selected <- array("",length(text))
  selected[default] <- "selected='selected'"
  if (is.null(optionvalue)) optionvalue <- text
  if (optionvalue != "") optionvalue = paste("value='", optionvalue, "'", sep="")
  str <- paste(ifelse(contenteditablewrapper, "<span contentEditable='false'>", ""),
               "<select", HTMLargs(name=name, size=size, id=id, ...), ">",
               paste("<option ",optionvalue," ",selected,">",text,"</option>",sep="",collapse="\n"),
               "</select>",
               ifelse(contenteditablewrapper, "</span>", ""),
               "\n",
               sep="")
  class(str) <- "HTMLchunk"
  str
}

"HTMLlink" <- function(url, text, ...) {
  str <- paste("<span contentEditable='false'>",
               "<a ", HTMLargs(href = url, ...), ">", text,
               "</a>",
               "</span>\n",
               sep = "")
  class(str) <- "HTMLchunk"
  str
}

"HTMLimg" <- function(filename = RpadPlotName(), ...) 
  HTMLtag("img", src = RpadURL(filename), ...)

"HTMLembed" <- function(filename, width = 600, height = 600, ...) 
  HTMLtag("embed", src = filename, width = width, height = height, ...)
  


