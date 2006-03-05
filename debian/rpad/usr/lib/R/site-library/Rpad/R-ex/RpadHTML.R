### Name: RpadHTML
### Title: Rpad utilities
### Aliases: ROutputFormat HTMLon HTMLoff H HtmlTree HTML HTMLh1 HTMLh2
###   HTMLh3 HTMLh4 HTMLh5 HTMLargs HTMLtag HTMLetag HTMLradio HTMLcheckbox
###   HTMLselect HTMLinput HTMLlink HTMLimg HTMLembed BR print.condition
###   HTML.data.frame
### Keywords: math

### ** Examples

  a <- data.frame(x = 1:10, y = (1:10)^3)

  # fancy HTML output
  HTMLon()
  H(summary(a))
  HTMLoff()
  summary(a)

  # generate some GUI elements
  # - normally done in an Rpad_input section with rpad_run="init"
  HTMLon() # switch to html mode
  data(state)
  HTMLselect("favoriteAmericanState", state.name) # generate the select box

  H("div", "Hello world") # a simple div: "<div>Hello world</div>"
  H("div", class="helloStyle", "Hello world") # a div with a class
    # --> "<div class='helloStyle'>Hello world</div>"

  # you can nest them:
  H("div", class = "myClass", dojoType = "tree",
    "This is some text in the div ",  
    H("em", "emphasized"), "plus some more",
    "and more",
    H("div", class = "anotherClass",
      "text in the div",
      c(1,5,8)))



