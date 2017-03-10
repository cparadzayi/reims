# API design Principles

Some sections article are adapted from an [e-book](https://apigee.com/about/cp/api-design-principles) written by a team at [apigee](https://apigee.com).

**Further reading**

* http://blog.mwaysolutions.com/2014/06/05/10-best-practices-for-better-restful-api/
* http://vinaysahni.com/best-practices-for-a-pragmatic-restful-api

---
## Introduction

> This article is a collection of design practices that has have developed in collaboration with
some of the leading API teams around the world...

Developers are the consumers of the APIs we develop, and they are the ones we ought to impress by designing intuitive and consistent APIs. Happy developers make the best code so the effort to apply design principles is worth it.

## Quick guide lines

  * Keep the base URL simple and intuitive
  * Nouns are good, verbs are bad
  * Use two base URLs for each resource
  * Use HTTP verbs to operate on collections and elements
  * Simplify associations - sweep complexity under the ‘?’
  * Keep the API intuitive by simplifying the associations between resources.
  * Good error handling

### Keep the base URL simple and intuitive
The base URL is the most important design affordance of your API. A simple and intuitive
base URL design makes using your API easy.

In the same manner that door handle's design should communicate whether you pull or
push so should the first impressions of the API to the developer be. This brings us to the design principle ```Use two base URLs per resource```.

Consider the following example, we are going to be model our demo API around a resource object, a stand. The first URL is for a collection; the second is for a specific element in the collection.

```
/stands
/stands/123
```
This will also force us to ```keep verbs out of our base URLs```. Why? This is because verb base APIs tend to produce many inconsistent routes. Consider the following

```
/stands/getAllStands
/stands/getAllReservedStands
/stands/getAllOutstanding
/stands/saveAllLeasedStands
...
```
What do you notice? Inconsistency, lack of intuitiveness of the API design and potentially thousand of routes to that can come up. So how do we get to use verbs but without placing them in the base URL?

### Use HTTP verbs to operate on collections and elements

Our HTTP verbs are ```POST``` ```GET``` ```PUT``` ```DELETE``` which we can map out to a acronym **CRUD** (**C**reate, **R**ead, **U**pdate and **D**elete respectively ).
Let's see what we can do with our two resources ```/stands``` and ```/stands/123``` together with the four verbs.

|Resource           | POST             | GET            | PUT                                     | DELETE            |
|-------------------|------------------|----------------|-----------------------------------------|-------------------|
| ```/stands```     | Create new stand | List stands    | Bulk update stands                      | Delete all stands |
| ```/stands/123``` | Error            | Show stand 123 | If exists update stand 123. If not error | Delete stand 123  |

**Now that I'm using nouns should I use singular or plural**

Since the most common HTTP verb to be used is ```GET``` it makes sense to use plural form. You can use both  plural and singular but be sure to be consistent and document your API well indicating the cases where either a singular or plural form o the noun ins required

**Concrete names are better than abstract ones**

An API that models everything at the highest level of abstraction - as ```/items``` or ```/assets``` loses the opportunity to paint a tangible picture for developers to know
what they can do with this API. It is more compelling and useful to see the resources listed
as ```/blogs```, ```/videos```, ```/stands```, all with a route that identifies with the resource being dealt with.

Actually the level of abstraction depends on your project but as a rule of thumb aim for concrete naming and aim to maintain the number of resource below 24

> **In summary,** an intuitive API uses plural rather than singular nouns, and concrete rather
than abstract names.

### Simplify associations - sweep complexity under the ‘?’

Lets explore how we can explore API design considerations when handling associations between
resources and parameters like states and attributes.

**Associations**

Remember we said ```nouns are good and verbs are bad```. Consider the following API requests to get the stands owned by a particular person, 123.
```
1. GET /getStandsOwnedBy/123
2. GET /owners/123/stands

1. POST /postStandsOwnedBy/123
2. POST /owners/123/stands
```
Which one is more intuitive, feels more natural to the developer? If you have grasped the concept you have seen why verbs are bad.
Now, the relationships can be complex. Owners have relationships with salesman, who
have relationships with stands, who have relationships with city, and so on. It's not
uncommon to see people string these together making a URL 5 or 6 levels deep. Remember
that once you have the primary key for one level, you usually don't need to include the
levels above because you've already got your specific object. In other words, you shouldn't
need too many cases where a URL is deeper than what we have above
```
/resource/identifier/resource
```

**Sweep complexity behind the '?'**

Complexities can include many states that can be updated, changed, queried, as well as the attributes associated with a resource.

Strive to make it simple for developers by placing optional states and attributes behind the '?'. For example to get all the sold stands in Gweru we could use

```
GET /stands?city=gweru&sold=true
```
> **In summary**, keep your API intuitive by simplifying the associations between resources,
and sweeping parameters and other complexities under the rug of the HTTP question
mark.

### Good error handling

Firstly developers learn to use an PI through error. TO them the inner functionalities of the API are a black box so errors are become a key tool providing context and visibility on how to use your API.

Secondly developers depend on well designed errors when troubleshooting issues that come up when the applications they build with your API are now in the hands of their users.

There are three approaches that are adopted by some of the big guys in the game:

  **facebook**

  ```javascript
  HTTP Status Code: 200
  {
     "type" : "OauthException",
     "message":"(#803) Some of the aliases you requested do not exist: foo.bar"
  }
  ```

  **Twilio**

  ```javascript
  HTTP Status Code: 401
  {
     "status" : "401",
     "message":"Authenticate",
     "code": 20003,
     "more  info": "http://www.twilio.com/docs/errors/20003"
  }
  ```

  **SimpleGeo**

  ```javascript
  HTTP Status Code: 401
  {
    "code" : 401,
    "message": "Authentication Required"
  }
  ```

  **So what does this all mean?**

  * **Facebook**

      No matter what happens on a Facebook request, you get back the 200-status code -
      everything is OK. Many error messages also push down into the HTTP response. Here they
      also throw an #803 error but with no information about what #803 is or how to react to it.

  * **Twilio**

      Twilio does a great job aligning errors with HTTP status codes. Like Facebook, they provide
      a more granular error message but with a link that takes you to the documentation.
      Community commenting and discussion on the documentation helps to build a body of
      information and adds context for developers experiencing these errors.

  * **SimpleGeo**

      SimpleGeo provides error codes but with no additional value in the payload

**Best Practices**

Each of the big guys above has his own way of dealing with errors. So which one is the right way? All of them!

1. **Use http status codes**

    There are over 70 http codes but you don't have to use them all. After boiling it all down only these 3 functions remain:

     * Everything worked - success
     * The application did something wrong – client error
     * The API did something wrong – server error

  So as a general rule start by using the following 3 If you need more, add them. But you shouldn't need to go beyond 8.

    * 200 - OK
    * 400 - Bad Request
    * 500 - Internal Server error

  If you're not comfortable reducing all your error conditions to these 3, try picking among these additional 5:
    * 201 - Created
    * 304 - Not Modified
    * 404 – Not Found
    * 401 - Unauthorized
    * 403 - Forbidden

2. **Make messages returned in the payload as verbose as possible.**

    Enter as much detail about what could have caused the error that the developer consuming your API can easily troubleshoot.

### Versioning

  **Never release an API without a version and make the version mandatory**

  Let's see how some of the API sharks handle versioning.

  * Twilio ```/2010-04-01/Accounts/```
  * salesforce.com ```/services/data/v20.0/objects/Account```
  * Facebook ```?v=1.0```

  **twilio**

      Makes use of a time stamp. Very clever but potentially confusing. Is the time compilation time or the time when the API was released?

  **salesforce**

      Makes use of a the **v.** notation. The **.0** implies that the API interface changes frequently and that's not good for production. The logic behind the API can change frequently but no the  interface itself.

  **facebook**

      Also makes use of a of the **v.** notation but makes it an optional parameter. If facebook ups the version of the API all the apps tat didn't include the version could break.

**So what versioning method should I use?**

Specify the version with a 'v' prefix. Move it all the way to the left in the URL so that it has
the highest scope (e.g. /v1/dogs).
Use a simple ordinal number. Don't use the dot notation like v1.2
