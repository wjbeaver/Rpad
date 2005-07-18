\name{RpadHTML}
\alias{ROutputFormat}
\alias{HTMLon}     
\alias{HTMLoff}    
\alias{HTMLh1}     
\alias{HTMLh2}     
\alias{HTMLh3}     
\alias{HTMLh4}     
\alias{HTMLh5}     
\alias{HTMLargs}      
\alias{HTMLtag}      
\alias{HTMLetag}      
\alias{HTMLradio}      
\alias{HTMLcheckbox}   
\alias{HTMLselect}     
\alias{HTMLinput}      
\alias{HTMLlink}       
\alias{HTMLimg}        
\alias{HTMLembed}      
\alias{print.condition}
\alias{HTML.data.frame}   
                   
\title{ Rpad utilities }
\description{      
  Rpad utilities to generate HTML output.
}
\usage{
  ROutputFormat(Format)
  HTMLon()
  HTMLoff()
  HTMLh1(text)
  HTMLh2(text)
  HTMLh3(text)
  HTMLh4(text)
  HTMLh5(text)
  HTMLargs(..., quoteChar = "'")
  HTMLtag(tagName, ...)
  HTMLetag(tagName)
  HTMLradio(variableName, commonName = "radio", text = "", ...)
  HTMLcheckbox(name, text = "", ...)
  HTMLselect(name, text, default = 1, size = 1, id = name, contenteditablewrapper = TRUE, optionvalue = text, ...)
  HTMLinput(name, value = "", rpadtype = "Rvariable", contenteditablewrapper = TRUE, ...)
  HTMLlink(url, text, ...)
  HTMLimg(filename = RpadPlotName(), ...)
  HTMLembed(filename, width = 600, height = 600, ...)
  HTML.data.frame(x, file = .HTML.file, Border = 1, innerBorder = 0,
    classfirstline = "firstline", classfirstcolumn = "firstcolumn",
    classcellinside = "cellinside",  append = TRUE , align = "center",
    caption = "", captionalign = "bottom", classcaption = "captiondataframe",
	classtable = "dataframe", digits = getOption("R2HTML.format.digits"),
	nsmall = getOption("R2HTML.format.nsmall"),
    big.mark = getOption("R2HTML.format.big.mark"),
	big.interval = getOption("R2HTML.format.big.interval"),
	decimal.mark = getOption("R2HTML.format.decimal.mark"),
    sortableDF = getOption("R2HTML.sortableDF"), ...)
  print.condition(x, ...)
}

\arguments{
  \item{Format}{ a string specifying the desired output format, like "html", "text", or "none" }
  \item{text}{ specifies the text to be displayed in the HTML output. }
  \item{quoteChar} { specifies the quote character for HTML parameters. }
  \item{tagName}{ is a string specifying the HTML nodeName ("H1" or
    "DIV" for example). }
  \item{variableName, commonName}{ specify attributes of the radio
    element. \code{commonName} specifies the common radio elements that
    are grouped together (the name attribute of the radio element)--this gets translated into the R variable with
    the same name. \code{variableName} is the string result assigned to
    \code{commonName} when this radio item is selected (the value attribute of the radio element).}
  \item{name}{ is the name attribute in HTML that is translated into the
    R variable with the same name.}
  \item{value}{ is the initial value of the input box. }
  \item{url}{ is the URL for the <A> element.}
  \item{contenteditablewrapper}{ is a logical that specifies whether a
    wrapper is placed around the output to disable editing. Internet
    Explorer needs this to make links and input elements active.}
  \item{default, size, id, optionvalue}{ specify parameters of a select
    box. \code{default} specifies which of the options is selected initially.}
  \item{filename, width, height}{ are parameters of an IMG or EMBED object.}
  \item{rpadtype}{ is the "rpad\_type" attribute of an INPUT
    element. Normal values are either "Rvariable" or "Rstring" but other
    values of "rpad\_type" should also be possible. }
  \item{file, Border, innerBorder, classfirstline, classfirstcolumn, classcellinside, append, align, caption, captionalign, classcaption, classtable, digits, nsmall, big.mark, big.interval, decimal.mark, sortableDF}{ Parameters to format a HTML table. }
  \item{x}{ == To define == }
  \item{...}{ arguments are passed on as HTML arguments for the given tag.}
}
\details{
\code{HTMLon} and \code{HTMLoff} specify how Rpad
interprets results (either HTML or text). Rpad output sections are normally rendered as plain text with
a fixed-width font, so text script outputs are formatted
properly. The output blocks can also contain HTML codes for
displaying images or for formatting blocks. To change to HTML
formatting, use \code{HTMLon()} (which sends '<htmlon/>' to the output).
To turn HTML mode off, use \code{HTMLoff()} (which sends
'<htmloff/>'). \code{HTMLon} and \code{HTMLoff} only apply to the
existing Rpad input section; they don't carry over into the next.

\code{HTMLtag} and \code{HTMLetag} generate HTML for an arbitrary HTML
tag with the specified name and arguments. 

\code{ROutputMode} changes how R behaves with automatic
printing. Possible
values are: "text" (the default), "html", or "none". "text" is like
at the command line: values returned in the script are automatically printed (without an explicit \code{print}
statement) in
standard text format. With "html", values
returned are automatically printed, but HTML output is generated by
using the \code{HTML} method instead of the \code{print} method. \code{ROutputMode} applies to all subsequent Rpad input
section, including a rollover back to the beginning when a page is run
several times.

}

\value{
  All of the HTML code generation routines return a character string of
  class HTMLchunk. With automatic printing, the string is sent to the
  output (with \code{cat}). This has the effect that the HTML is
  displayed in Rpad. Note that if a HTML generation function is used
  inside of a loop or other scenario where the function results are not
  automatically printed, then you need to enclose the function with
  \code{cat} or \code{print}.

  \code{HTMLargs} returns a string with the arguments as "a='arg1'
  b='arg2'", and so on. Note the use of single quotes. This will affect
  how quoted strings should be passed as elements.
}

\author{ Tom Short, EPRI Solutions, Inc., (\email{tshort@eprisolutions.com}) }

\seealso{\code{R2HTML} for other useful HTML routines that can be used in Rpad. }

\examples{
  #make some graphs (a default graphics device is already available)
  x <- 1:10
  y2 <- x^3

  # fancy HTML output
  HTMLon()
  ROutputFormat('html')
  summary(y2)
  HTMLoff()
  ROutputFormat('text')
  summary(y2)

  # generate some GUI elements
  # - normally done in an Rpad_input section with rpad_run="init"
  HTMLon() # switch to html mode
  data(state)
  HTMLselect("favoriteAmericanState", state.name) # generate the select box
}

\keyword{ math }
