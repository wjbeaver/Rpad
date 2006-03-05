### Name: RpadGraphing
### Title: Rpad graphing utilities
### Aliases: fspdf graphoptions newgraph showgraph RpadPlotName
### Keywords: math

### ** Examples

# make some graphs (a default graphics device is already available)
  x <- 1:10
  y <- x^2
  y2 <- x^3
  if (capabilities("png")) graphoptions(type="Rpng")
  newgraph()
  plot(x, y)  # does the plot
  plot(x, y2) # does the second plot
  HTMLon()    # sets Rpad to HTML output
  showgraph() # closes the device, outputs the HTML for the both
              # images, and creates the next device
  plot(x, y2)
  showgraph()

# graphs with named files:
  newgraph("graph_A")
  plot(x, y)
  showgraph("graph_A")
  newgraph("graph_B", width = 4, height = 6) # also adjust the width and height
  plot(x, y2)
  showgraph("graph_B")



